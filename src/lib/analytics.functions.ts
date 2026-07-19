import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const LogInput = z.object({
  sessionId: z.string().min(1).max(128),
  section: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
});

function serverClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const logAnalyticsEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LogInput.parse(data))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("analytics_events").insert({
      session_id: data.sessionId,
      section: data.section,
      action: data.action,
    });
    if (error) {
      // Never surface analytics errors to callers; just log server-side.
      console.warn("[analytics] insert failed:", error.message);
    }
    return { ok: true };
  });

export type AnalyticsSummary = {
  totalSessions: number;
  activeSessions1d: number;
  activeSessions7d: number;
  activeSessions30d: number;
  totalUsers: number;
  newUsers7d: number;
  totalEvents: number;
  featureUsage: Array<{ section: string; action: string; events: number; sessions: number }>;
  dailyActiveSessions: Array<{ date: string; sessions: number }>;
  dailySignups: Array<{ date: string; users: number }>;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export const getAnalyticsSummaryFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsSummary> => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull last 30 days of events (bounded read).
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error } = await supabaseAdmin
      .from("analytics_events")
      .select("session_id, section, action, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);

    const rows = events ?? [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const sessionsAll = new Set<string>();
    const sessions1d = new Set<string>();
    const sessions7d = new Set<string>();
    const sessions30d = new Set<string>();
    const featureMap = new Map<string, { events: number; sessions: Set<string> }>();
    const dailyMap = new Map<string, Set<string>>();

    for (const row of rows) {
      const t = new Date(row.created_at).getTime();
      const age = now - t;
      sessionsAll.add(row.session_id);
      if (age <= oneDay) sessions1d.add(row.session_id);
      if (age <= 7 * oneDay) sessions7d.add(row.session_id);
      if (age <= 30 * oneDay) sessions30d.add(row.session_id);

      const key = `${row.section}::${row.action}`;
      const bucket = featureMap.get(key) ?? { events: 0, sessions: new Set<string>() };
      bucket.events += 1;
      bucket.sessions.add(row.session_id);
      featureMap.set(key, bucket);

      const d = dayKey(row.created_at);
      const daySet = dailyMap.get(d) ?? new Set<string>();
      daySet.add(row.session_id);
      dailyMap.set(d, daySet);
    }

    const featureUsage = Array.from(featureMap.entries()).map(([key, v]) => {
      const [section, action] = key.split("::");
      return { section, action, events: v.events, sessions: v.sessions.size };
    });

    // Build last 14 days series (fills gaps with 0).
    const dailyActiveSessions: Array<{ date: string; sessions: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * oneDay).toISOString().slice(0, 10);
      dailyActiveSessions.push({ date: d, sessions: dailyMap.get(d)?.size ?? 0 });
    }

    // Count auth users via admin RPC (reliable on Lovable Cloud where the
    // admin listUsers API can fail silently and leave totals at 0).
    let totalUsers = 0;
    let newUsers7d = 0;
    const signupsByDay = new Map<string, number>();
    try {
      const { data: stats, error: sErr } = await context.supabase.rpc("admin_user_stats");
      if (sErr) throw sErr;
      const row = Array.isArray(stats) ? stats[0] : stats;
      if (row) {
        totalUsers = Number(row.total_users ?? 0);
        newUsers7d = Number(row.new_users_7d ?? 0);
        const signups = (row.signups ?? {}) as Record<string, number>;
        for (const [day, cnt] of Object.entries(signups)) {
          signupsByDay.set(day, Number(cnt));
        }
      }
    } catch (err) {
      console.warn("[analytics] admin_user_stats failed:", err);
    }

    const dailySignups: Array<{ date: string; users: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * oneDay).toISOString().slice(0, 10);
      dailySignups.push({ date: d, users: signupsByDay.get(d) ?? 0 });
    }

    return {
      totalSessions: sessionsAll.size,
      activeSessions1d: sessions1d.size,
      activeSessions7d: sessions7d.size,
      activeSessions30d: sessions30d.size,
      totalUsers,
      newUsers7d,
      totalEvents: rows.length,
      featureUsage,
      dailyActiveSessions,
      dailySignups,
    };
  });
