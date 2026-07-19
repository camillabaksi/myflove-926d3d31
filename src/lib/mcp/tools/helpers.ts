import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function supabaseForUser(token: string): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readKv<T>(
  client: SupabaseClient<Database>,
  userId: string,
  key: string,
  fallback: T,
): Promise<T> {
  const { data } = await client
    .from("user_kv")
    .select("value")
    .eq("user_id", userId)
    .eq("key", key)
    .maybeSingle();
  return (data?.value as T | undefined) ?? fallback;
}

export async function writeKv(
  client: SupabaseClient<Database>,
  userId: string,
  key: string,
  value: unknown,
): Promise<void> {
  const { error } = await client
    .from("user_kv")
    .upsert({ user_id: userId, key, value: value as never });
  if (error) throw error;
}
