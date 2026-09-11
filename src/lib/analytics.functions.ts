import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LogInput = z.object({
  sessionId: z.string().min(1).max(128),
  section: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
});

/**
 * Anonym loggning: vi sparar ENDAST vilken del av appen som användes, vilken
 * handling det var, ett slumpat sessions-id (roteras dygnsvis i klienten) och
 * tidpunkt. Ingen användar-id, e-post, IP eller innehåll sparas någonsin.
 */
export const logAnalyticsEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LogInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_events").insert({
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
  /** Snitt antal händelser per session (engagemang). */
  avgEventsPerSession: number;
  /** Andel sessioner som varit aktiva fler än en dag (retention), 0-100. */
  returningRate: number;
  /** DAU/MAU i procent — hur ofta appen används, 0-100. */
  stickiness: number;
  /** Antal olika delar av appen en session använder i snitt (bredd). */
  avgSectionsPerSession: number;
  /** Andel sessioner som gjort minst en riktig handling (inte bara besök), 0-100. */
  actionRate: number;
  /** Hur många sessioner som använt varje steg i dagliga loopen. */
  coreLoop: Array<{ step: string; sessions: number }>;
  featureUsage: Array<{ section: string; action: string; events: number; sessions: number }>;
  dailyActiveSessions: Array<{ date: string; sessions: number }>;
  dailyEvents: Array<{ date: string; events: number }>;
  dailySignups: Array<{ date: string; users: number }>;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Vilka sektioner som räknas till varje steg i den dagliga loopen. */
const CORE_LOOP: Array<{ step: string; sections: string[] }> = [
  { step: "Fånga", sections: ["quickflow", "dump", "notes", "anteckningar"] },
  { step: "Planera", sections: ["today", "my-day", "min-dag", "tasks", "calendar", "flowplan"] },
  { step: "Göra", sections: ["fokus", "pomodoro", "routines", "rutiner", "cleaning", "medicin"] },
  { step: "Reflektera", sections: ["mood", "energy", "energy-map", "wellness", "flowscore"] },
];

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
    // PostgREST returnerar max 1000 rader per anrop – hämta i sidor.
    type EvRow = { session_id: string; section: string; action: string; created_at: string };
    const rows: EvRow[] = [];
    for (let from = 0; from < 500000; from += 1000) {
      const { data: chunk, error } = await supabaseAdmin
        .from("analytics_events")
        .select("session_id, section, action, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...((chunk ?? []) as EvRow[]));
      if (!chunk || chunk.length < 1000) break;
    }
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const sessionsAll = new Set<string>();
    const sessions1d = new Set<string>();
    const sessions7d = new Set<string>();
    const sessions30d = new Set<string>();
    const featureMap = new Map<string, { events: number; sessions: Set<string> }>();
    const dailyMap = new Map<string, Set<string>>();
    const dailyEventMap = new Map<string, number>();
    const sessionDays = new Map<string, Set<string>>();
    const sessionSections = new Map<string, Set<string>>();
    const sessionsWithAction = new Set<string>();
    const loopSessions = CORE_LOOP.map(() => new Set<string>());

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
      dailyEventMap.set(d, (dailyEventMap.get(d) ?? 0) + 1);

      const days = sessionDays.get(row.session_id) ?? new Set<string>();
      days.add(d);
      sessionDays.set(row.session_id, days);

      const sections = sessionSections.get(row.session_id) ?? new Set<string>();
      sections.add(row.section);
      sessionSections.set(row.session_id, sections);

      if (row.action !== "view") sessionsWithAction.add(row.session_id);

      CORE_LOOP.forEach((step, i) => {
        if (step.sections.includes(row.section)) loopSessions[i].add(row.session_id);
      });
    }

    const featureUsage = Array.from(featureMap.entries()).map(([key, v]) => {
      const [section, action] = key.split("::");
      return { section, action, events: v.events, sessions: v.sessions.size };
    });

    // Build last 14 days series (fills gaps with 0).
    const dailyActiveSessions: Array<{ date: string; sessions: number }> = [];
    const dailyEvents: Array<{ date: string; events: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * oneDay).toISOString().slice(0, 10);
      dailyActiveSessions.push({ date: d, sessions: dailyMap.get(d)?.size ?? 0 });
      dailyEvents.push({ date: d, events: dailyEventMap.get(d) ?? 0 });
    }

    const sessionCount = sessionsAll.size;
    const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
    const avg = (total: number, whole: number) =>
      whole > 0 ? Math.round((total / whole) * 10) / 10 : 0;

    const multiDaySessions = Array.from(sessionDays.values()).filter((d) => d.size > 1).length;
    const sectionsTotal = Array.from(sessionSections.values()).reduce((s, v) => s + v.size, 0);

    // Count auth users via the privileged RPC after the admin role check above.
    // The function is no longer callable by ordinary signed-in clients.
    let totalUsers = 0;
    let newUsers7d = 0;
    const signupsByDay = new Map<string, number>();
    try {
      const { data: stats, error: sErr } = await supabaseAdmin.rpc("admin_user_stats");
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
      totalSessions: sessionCount,
      activeSessions1d: sessions1d.size,
      activeSessions7d: sessions7d.size,
      activeSessions30d: sessions30d.size,
      totalUsers,
      newUsers7d,
      totalEvents: rows.length,
      avgEventsPerSession: avg(rows.length, sessionCount),
      returningRate: pct(multiDaySessions, sessionCount),
      stickiness: pct(sessions1d.size, sessions30d.size),
      avgSectionsPerSession: avg(sectionsTotal, sessionCount),
      actionRate: pct(sessionsWithAction.size, sessionCount),
      coreLoop: CORE_LOOP.map((step, i) => ({ step: step.step, sessions: loopSessions[i].size })),
      featureUsage,
      dailyActiveSessions,
      dailyEvents,
      dailySignups,
    };
  });

export type AnalyticsExportRow = {
  date: string;
  section: string;
  action: string;
  events: number;
  sessions: number;
};

export type AnalyticsExport = {
  from: string;
  to: string;
  totals: { events: number; sessions: number; days: number };
  rows: AnalyticsExportRow[];
  daily: Array<{ date: string; sessions: number; events: number }>;
};

const ExportInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Anonym export: endast datum, sektion, handling och aggregerade antal. */
export const getAnalyticsExportFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ExportInput.parse(data))
  .handler(async ({ data, context }): Promise<AnalyticsExport> => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fromIso = new Date(`${data.from}T00:00:00.000Z`).toISOString();
    const toIso = new Date(`${data.to}T23:59:59.999Z`).toISOString();

    type EvRow = { session_id: string; section: string; action: string; created_at: string };
    const rows: EvRow[] = [];
    for (let from = 0; from < 500000; from += 1000) {
      const { data: chunk, error } = await supabaseAdmin
        .from("analytics_events")
        .select("session_id, section, action, created_at")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...((chunk ?? []) as EvRow[]));
      if (!chunk || chunk.length < 1000) break;
    }
    const byKey = new Map<string, { events: number; sessions: Set<string> }>();
    const byDay = new Map<string, { events: number; sessions: Set<string> }>();
    const allSessions = new Set<string>();

    for (const row of rows) {
      const day = row.created_at.slice(0, 10);
      const key = `${day}::${row.section}::${row.action}`;
      const bucket = byKey.get(key) ?? { events: 0, sessions: new Set<string>() };
      bucket.events += 1;
      bucket.sessions.add(row.session_id);
      byKey.set(key, bucket);

      const dayBucket = byDay.get(day) ?? { events: 0, sessions: new Set<string>() };
      dayBucket.events += 1;
      dayBucket.sessions.add(row.session_id);
      byDay.set(day, dayBucket);

      allSessions.add(row.session_id);
    }

    return {
      from: data.from,
      to: data.to,
      totals: { events: rows.length, sessions: allSessions.size, days: byDay.size },
      rows: Array.from(byKey.entries())
        .map(([key, v]) => {
          const [date, section, action] = key.split("::");
          return { date, section, action, events: v.events, sessions: v.sessions.size };
        })
        .sort((a, b) => a.date.localeCompare(b.date) || b.events - a.events),
      daily: Array.from(byDay.entries())
        .map(([date, v]) => ({ date, events: v.events, sessions: v.sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  });
