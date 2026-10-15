import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { registrationPlatform, type RegistrationPlatform } from "@/lib/registration-platform";

// Verify the calling user is admin. Uses the caller's RLS-scoped client to
// read their own user_roles row — no dependency on has_role EXECUTE grants.
async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type AdminFrictionItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  impact: number | null;
  frequency: number | null;
  mental_load: number | null;
  status: string;
  reporter_id: string;
  reporter_email: string | null;
  created_at: string;
  updated_at: string;
  vote_count: number;
};

export const listAllFrictionItemsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFrictionItem[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: items, error } = await supabaseAdmin
      .from("friction_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: votes } = await supabaseAdmin.from("friction_votes").select("item_id");
    const voteCounts = new Map<string, number>();
    for (const v of votes ?? []) {
      voteCounts.set(v.item_id, (voteCounts.get(v.item_id) ?? 0) + 1);
    }

    const reporterIds = Array.from(
      new Set((items ?? []).map((i) => i.reporter_id).filter(Boolean)),
    );
    const emails = new Map<string, string | null>();
    for (const uid of reporterIds) {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        emails.set(uid, data.user?.email ?? null);
      } catch {
        emails.set(uid, null);
      }
    }

    return (items ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      impact: i.impact,
      frequency: i.frequency,
      mental_load: i.mental_load,
      status: i.status,
      reporter_id: i.reporter_id,
      reporter_email: emails.get(i.reporter_id) ?? null,
      created_at: i.created_at,
      updated_at: i.updated_at,
      vote_count: voteCounts.get(i.id) ?? 0,
    }));
  });

export const updateFrictionStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "planned", "in_progress", "done", "wontfix"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("friction_items")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFrictionItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("friction_votes").delete().eq("item_id", data.id);
    const { error } = await supabaseAdmin.from("friction_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminUserRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  last_visit_at: string | null;
  visits: number;
  roles: string[];
  registration_platform: RegistrationPlatform;
};

const UserFilter = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .optional();

function displayName(meta: Record<string, unknown>, email: string | null): string | null {
  const pick = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string).trim() : "");
  const full = pick("full_name") || pick("name");
  if (full) return full;
  const first = pick("first_name") || pick("given_name");
  if (first) return first;
  const local = email?.split("@")[0] ?? "";
  if (!local) return null;
  const base = local.split(/[._-]/)[0] ?? local;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export const listUsersWithRolesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UserFilter.parse(data))
  .handler(async ({ data, context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Include every account in the platform totals, also beyond the first API page.
    const users = new Map<string, User>();
    for (let page = 1; ; page++) {
      const { data: batch, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      for (const user of batch.users) users.set(user.id, user);
      if (batch.users.length < 200) break;
    }

    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    // Besöksstatistik är helt anonym och kopplas aldrig till konton.

    const from = data?.from ? new Date(`${data.from}T00:00:00.000Z`).getTime() : null;
    const to = data?.to ? new Date(`${data.to}T23:59:59.999Z`).getTime() : null;
    const inRange = (iso: string | null | undefined) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false;
      return true;
    };

    const rows = [...users.values()].map((u) => {
      return {
        user_id: u.id,
        name: displayName((u.user_metadata ?? {}) as Record<string, unknown>, u.email ?? null),
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        // Senast aktiv: kontot uppdateras när sessionen förnyas, dvs. när
        // användaren faktiskt öppnar appen – även utan ny inloggning.
        last_visit_at: u.updated_at ?? null,
        visits: 0,
        roles: rolesByUser.get(u.id) ?? [],
        registration_platform: registrationPlatform(u.user_metadata),
      };
    });

    const filtered =
      from === null && to === null
        ? rows
        : rows.filter(
            (r) => inRange(r.last_visit_at) || inRange(r.last_sign_in_at) || inRange(r.created_at),
          );

    return filtered.sort((a, b) =>
      (b.last_visit_at ?? b.last_sign_in_at ?? "").localeCompare(
        a.last_visit_at ?? a.last_sign_in_at ?? "",
      ),
    );
  });

const RoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user"]),
});

export const grantRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RoleInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    // Ignore unique-violation (already has role)
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RoleInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && data.role === "admin") {
      throw new Error("Du kan inte ta bort din egen admin-roll.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
