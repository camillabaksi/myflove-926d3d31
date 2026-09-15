import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Ärlig användarstatistik (kontonivå).
 *
 * Skiljer på registrerade konton, aktiverade konton, konton med egen sparad
 * appdata och verkligt aktiva användare. Interna konton (admin + demo) räknas
 * separat och ingår inte i de externa siffrorna.
 *
 * Läser bara — inga konton eller rader ändras någonsin här.
 */

const DEMO_EMAIL = "investor@myflove.se";

/**
 * Nycklar i user_kv som räknas som riktigt innehåll. Teknisk state,
 * onboarding-flaggor, layout och cache är medvetet uteslutna så att ett besök
 * inte gör någon till användare.
 */
const MEANINGFUL_KV_KEYS = [
  "myflow-tasks",
  "myflow-reminders",
  "myflow-moods",
  "myflove-routines",
  "myflove-energy-log",
  "myflove-quickflow",
  "myflove-notes",
  "myflove-medications",
  "myflove-daily-checkin",
  "myflove-study-lectures",
  "myflove-training",
  "myflove-cleaning-done",
  "myflove-impact-history",
  "myflove-life-profile",
] as const;

export type UserFunnel = {
  /** Alla konton. */
  registered: number;
  /** Har loggat in minst en gång. */
  activated: number;
  /** Har egen sparad appdata (inte bara teknisk state). */
  withData: number;
  /** Inloggad senaste 30 dagarna OCH har egen sparad data. */
  active30d: number;
  /** Inloggad senaste 7 dagarna OCH har egen sparad data. */
  active7d: number;
  /** Nya konton senaste 7 dagarna (externa). */
  new7d: number;
  /** Registrerade men aldrig inloggade. */
  neverSignedIn: number;
  /** Inloggade men utan egen sparad data. */
  signedInNoData: number;
  /** Interna konton (grundare/admin + demo) — ingår inte i siffrorna ovan. */
  internal: number;
  generatedAt: string;
};

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Tomma listor/objekt räknas inte som innehåll. */
function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export const getUserFunnelFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserFunnel> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Alla konton (paginerat).
    type AuthUser = { id: string; email: string | null; created_at: string; last_sign_in_at?: string | null };
    const users: AuthUser[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const batch = (data?.users ?? []) as unknown as AuthUser[];
      users.push(...batch);
      if (batch.length < 200) break;
    }

    // 2. Konton med egen, meningsfull data.
    const withData = new Set<string>();

    const { data: kvRows } = await supabaseAdmin
      .from("user_kv")
      .select("user_id, key, value")
      .in("key", MEANINGFUL_KV_KEYS as unknown as string[]);
    for (const row of kvRows ?? []) {
      if (hasContent(row.value)) withData.add(row.user_id);
    }

    const tables: Array<[string, string]> = [
      ["energy_logs", "user_id"],
      ["energy_factors", "user_id"],
      ["flow_messages", "user_id"],
      ["children", "owner_id"],
      ["child_items", "owner_id"],
      ["push_reminders", "user_id"],
      ["household_members", "user_id"],
      ["friction_items", "reporter_id"],
    ];
    for (const [table, column] of tables) {
      const { data: rows } = await supabaseAdmin
        .from(table as never)
        .select(column)
        .limit(5000);
      for (const row of (rows ?? []) as unknown as Array<Record<string, string | null>>) {
        const id = row[column];
        if (id) withData.add(id);
      }
    }

    // 3. Interna konton: admin-rollen + demokontot.
    const { data: adminRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const internalIds = new Set((adminRows ?? []).map((r) => r.user_id));
    for (const u of users) {
      if ((u.email ?? "").toLowerCase() === DEMO_EMAIL) internalIds.add(u.id);
    }

    const now = Date.now();
    const days = (n: number) => now - n * 24 * 60 * 60 * 1000;
    const external = users.filter((u) => !internalIds.has(u.id));
    const signedInAt = (u: AuthUser) =>
      u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null;

    const activated = external.filter((u) => signedInAt(u) !== null);
    const dataUsers = external.filter((u) => withData.has(u.id));

    return {
      registered: external.length,
      activated: activated.length,
      withData: dataUsers.length,
      active30d: dataUsers.filter((u) => (signedInAt(u) ?? 0) > days(30)).length,
      active7d: dataUsers.filter((u) => (signedInAt(u) ?? 0) > days(7)).length,
      new7d: external.filter((u) => new Date(u.created_at).getTime() > days(7)).length,
      neverSignedIn: external.filter((u) => signedInAt(u) === null).length,
      signedInNoData: activated.filter((u) => !withData.has(u.id)).length,
      internal: users.length - external.length,
      generatedAt: new Date().toISOString(),
    };
  });
