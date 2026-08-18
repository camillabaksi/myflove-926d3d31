import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  roles: string[];
};

export const listUsersWithRolesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error: uErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (uErr) throw new Error(uErr.message);

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

    return (users.users ?? [])
      .map((u) => ({
        user_id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        roles: rolesByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
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
