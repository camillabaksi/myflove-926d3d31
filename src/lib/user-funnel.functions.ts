import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizePilotAccounts, type PilotAccounts } from "@/lib/pilot-statistics";

export type UserFunnel = PilotAccounts;

/** Account metadata only. Never inspect private plans, health logs or message content. */
export const getUserFunnelFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserFunnel> => {
    const { data, error } = await context.supabase.from("user_roles").select("role")
      .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (error || !data) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { readAdminAccounts } = await import("@/lib/admin-accounts.server");
    const now = Date.now();
    const accounts = await readAdminAccounts(supabaseAdmin, now);
    const admins = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data: roles, error: roleError } = await supabaseAdmin.from("user_roles")
        .select("user_id").eq("role", "admin").order("user_id").range(from, from + 999);
      if (roleError) throw new Error(roleError.message);
      for (const role of roles ?? []) admins.add(role.user_id);
      if (!roles || roles.length < 1000) break;
    }
    return summarizePilotAccounts(accounts, admins, now);
  });
