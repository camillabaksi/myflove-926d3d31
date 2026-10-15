import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PILOT_DAYS, summarizePilotUsage, type PilotEvent, type PilotUsage, type BrowserClassification } from "@/lib/pilot-statistics";

export const getPilotUsageFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PilotUsage> => {
    const { data, error } = await context.supabase.from("user_roles").select("role")
      .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (error || !data) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const since = new Date(now - PILOT_DAYS * 86_400_000).toISOString();
    const events: PilotEvent[] = [];
    // Fetch one extra page at the safety limit. A partial result must never look complete.
    for (let from = 0; ; from += 1000) {
      const { data: rows, error: readError } = await supabaseAdmin.from("analytics_events")
        .select("session_id, action, created_at").gte("created_at", since).lte("created_at", new Date(now).toISOString())
        .order("created_at").order("id").range(from, from + 999);
      if (readError) throw new Error(readError.message);
      if (from >= 500_000 && rows?.length) throw new Error("För stor datamängd för en fullständig översikt.");
      events.push(...(rows ?? []));
      if (!rows || rows.length < 1000) break;
    }
    const classifications: BrowserClassification[] = [];
    for (let from = 0; ; from += 1000) {
      // Read existing explicit labels only. No account linkage or identity lookup is introduced.
      const { data: rows, error: readError } = await supabaseAdmin.from("analytics_session_owners")
        .select("session_id, is_internal").order("session_id").range(from, from + 999);
      if (readError) throw new Error(readError.message);
      classifications.push(...(rows ?? []));
      if (!rows || rows.length < 1000) break;
    }
    return summarizePilotUsage(events, classifications, now);
  });
