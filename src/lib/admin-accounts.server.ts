import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { latestAccountActivity, type AccountActivity } from "@/lib/account-activity";

/** Privileged read: callers must check admin authorization before invoking this. */
export async function readAdminAccounts(client: SupabaseClient<Database>, now = Date.now()): Promise<AccountActivity[]> {
  const users = new Map<string, User>();
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    for (const user of data.users) users.set(user.id, user);
    if (data.users.length < 200) break;
  }
  const usedAt = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from("user_last_active").select("user_id, last_active_at")
      .order("user_id").range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) usedAt.set(row.user_id, row.last_active_at);
    if (!data || data.length < 1000) break;
  }
  return [...users.values()].map(user => ({
    user, lastActiveAt: latestAccountActivity(usedAt.get(user.id), user.last_sign_in_at, now),
  }));
}
