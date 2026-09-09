import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Granskningsvy per webbläsar-id ("besökare").
 *
 * Händelsetabellen innehåller medvetet inga användar-id. Den här modulen
 * kopplar i stället ihop händelser med tabellen analytics_session_owners,
 * där ett sessions-id kan märkas som internt (grundare, admin, demo, test).
 * Inga befintliga händelserader ändras eller raderas någonsin här.
 */

export type SessionRow = {
  sessionId: string;
  events: number;
  activeDays: number;
  firstSeen: string;
  lastSeen: string;
  /** true = märkt som intern (grundare/admin/test), false = extern, null = okänd. */
  isInternal: boolean | null;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  isDemo: boolean;
};

export type UserAnalytics = {
  totals: {
    events: number;
    sessions: number;
    internalEvents: number;
    internalSessions: number;
    externalEvents: number;
    externalSessions: number;
    unknownEvents: number;
    unknownSessions: number;
  };
  registeredUsers: number;
  sessions: SessionRow[];
};

const DEMO_EMAIL = "investor@myflove.se";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

const AuditInput = z.object({
  /** Antal dagar bakåt att granska. */
  days: z.number().int().min(1).max(400).default(400),
});

export const getUserAnalyticsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AuditInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<UserAnalytics> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    // Läs händelser i sidor så att inget tappas när volymen växer.
    type Ev = { session_id: string; created_at: string };
    const rows: Ev[] = [];
    const page = 10000;
    for (let from = 0; from < 200000; from += page) {
      const { data: chunk, error } = await supabaseAdmin
        .from("analytics_events")
        .select("session_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .range(from, from + page - 1);
      if (error) throw new Error(error.message);
      rows.push(...((chunk ?? []) as Ev[]));
      if (!chunk || chunk.length < page) break;
    }

    const agg = new Map<
      string,
      { events: number; days: Set<string>; first: string; last: string }
    >();
    for (const row of rows) {
      const bucket = agg.get(row.session_id) ?? {
        events: 0,
        days: new Set<string>(),
        first: row.created_at,
        last: row.created_at,
      };
      bucket.events += 1;
      bucket.days.add(row.created_at.slice(0, 10));
      if (row.created_at < bucket.first) bucket.first = row.created_at;
      if (row.created_at > bucket.last) bucket.last = row.created_at;
      agg.set(row.session_id, bucket);
    }

    const { data: owners, error: ownerErr } = await supabaseAdmin
      .from("analytics_session_owners")
      .select("session_id, user_id, is_internal");
    if (ownerErr) throw new Error(ownerErr.message);

    const ownerMap = new Map(
      (owners ?? []).map((o) => [o.session_id, o as { user_id: string | null; is_internal: boolean }]),
    );

    // Slå upp e-post och adminstatus för de konton som faktiskt är kopplade.
    const userIds = Array.from(
      new Set((owners ?? []).map((o) => o.user_id).filter((v): v is string => !!v)),
    );
    const emails = new Map<string, string>();
    for (const id of userIds) {
      try {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        if (u?.user?.email) emails.set(id, u.user.email);
      } catch {
        /* saknad användare påverkar inte statistiken */
      }
    }
    const { data: adminRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = new Set((adminRows ?? []).map((r) => r.user_id));

    const sessions: SessionRow[] = Array.from(agg.entries())
      .map(([sessionId, v]) => {
        const owner = ownerMap.get(sessionId);
        const userId = owner?.user_id ?? null;
        const email = userId ? (emails.get(userId) ?? null) : null;
        const isAdmin = !!userId && adminIds.has(userId);
        const isDemo = (email ?? "").toLowerCase() === DEMO_EMAIL;
        const isInternal = owner ? owner.is_internal || isAdmin || isDemo : null;
        return {
          sessionId,
          events: v.events,
          activeDays: v.days.size,
          firstSeen: v.first,
          lastSeen: v.last,
          isInternal,
          userId,
          email,
          isAdmin,
          isDemo,
        };
      })
      .sort((a, b) => b.events - a.events);

    const totals = {
      events: 0,
      sessions: sessions.length,
      internalEvents: 0,
      internalSessions: 0,
      externalEvents: 0,
      externalSessions: 0,
      unknownEvents: 0,
      unknownSessions: 0,
    };
    for (const s of sessions) {
      totals.events += s.events;
      if (s.isInternal === true) {
        totals.internalEvents += s.events;
        totals.internalSessions += 1;
      } else if (s.isInternal === false) {
        totals.externalEvents += s.events;
        totals.externalSessions += 1;
      } else {
        totals.unknownEvents += s.events;
        totals.unknownSessions += 1;
      }
    }

    let registeredUsers = 0;
    try {
      const { data: stats } = await supabaseAdmin.rpc("admin_user_stats");
      const row = Array.isArray(stats) ? stats[0] : stats;
      registeredUsers = Number(row?.total_users ?? 0);
    } catch {
      /* statistik om konton är inte kritisk här */
    }

    return { totals, registeredUsers, sessions };
  });

/** Kopplar den inloggade användarens webbläsar-id till kontot (första gången). */
export const claimAnalyticsSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().min(1).max(128) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("analytics_session_owners")
      .select("session_id, user_id, is_internal")
      .eq("session_id", data.sessionId)
      .maybeSingle();

    // Rör aldrig en rad som redan är märkt manuellt.
    if (existing?.user_id) return { ok: true };

    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    const email = (context.claims?.email ?? "").toString().toLowerCase();
    const internal = !!roleRow || email === DEMO_EMAIL || existing?.is_internal === true;

    const { error } = await supabaseAdmin.from("analytics_session_owners").upsert(
      {
        session_id: data.sessionId,
        user_id: context.userId,
        is_internal: internal,
      },
      { onConflict: "session_id" },
    );
    if (error) console.warn("[analytics] claim failed:", error.message);
    return { ok: true };
  });

/** Adminverktyg: märk (eller avmärk) ett webbläsar-id som internt. */
export const setSessionInternalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ sessionId: z.string().min(1).max(128), isInternal: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_session_owners").upsert(
      {
        session_id: data.sessionId,
        is_internal: data.isInternal,
        marked_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
