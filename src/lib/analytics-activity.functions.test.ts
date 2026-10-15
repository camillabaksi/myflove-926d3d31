import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsSummaryFn } from "./analytics.functions";
import { getUserAnalyticsFn } from "./analytics-audit.functions";

const state = vi.hoisted(() => ({ admin: true, listUsers: vi.fn(), usageError: false, eventReads: 0 }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  let validate = (data: unknown): unknown => data;
  const builder = { middleware: () => builder, inputValidator: (fn: typeof validate) => { validate = fn; return builder; },
    handler: (fn: (args: Record<string, unknown>) => unknown) => (args: Record<string, unknown>) => fn({ ...args, data: validate(args.data) }) };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { admin: { listUsers: state.listUsers } },
  rpc: async (name: string) => ({ data: name === "admin_user_stats" ? [{ total_users: 4, new_users_7d: 2, signups: { "2026-10-14": 2 } }] : [], error: null }),
  from: (table: string) => {
    if (table === "user_last_active") return { select: () => ({ order: () => ({ range: async () => state.usageError
      ? { data: null, error: { message: "unavailable" } } : { data: [{ user_id: "used", last_active_at: "2026-10-14T06:00:00Z" }], error: null } }) }) };
    if (table === "analytics_session_owners") return { select: async () => ({ data: [], error: null }) };
    if (table === "user_roles") return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    let since = "";
    const query = { select: () => query, gte: (_key: string, value: string) => { since = value; return query; }, order: () => query,
      range: async () => { state.eventReads++; return { data: [
        { session_id: "anonymous", section: "today", action: "view", created_at: "2026-10-14T06:00:00Z" },
        { session_id: "old-browser", section: "today", action: "view", created_at: "2026-08-14T06:00:00Z" },
      ].filter(row => row.created_at >= since), error: null }; } };
    return query;
  },
} }));
const now = Date.parse("2026-10-15T06:00:00Z");
const user = (id: string, created = "2026-01-01T06:00:00Z", login: string | null = null) => ({ id, email: `${id}@example.test`, user_metadata: {}, created_at: created, updated_at: "2026-10-15T06:00:00Z", last_sign_in_at: login });
const context = { userId: "admin", supabase: { from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state.admin ? { role: "admin" } : null }) };
  return query;
} } };
const summary = getAnalyticsSummaryFn as unknown as (args: { context: typeof context }) => ReturnType<typeof getAnalyticsSummaryFn>;
const audit = getUserAnalyticsFn as unknown as (args: { context: typeof context; data?: { days: number } }) => ReturnType<typeof getUserAnalyticsFn>;
beforeEach(() => {
  vi.clearAllMocks(); state.admin = true; state.usageError = false; state.eventReads = 0;
  vi.spyOn(Date, "now").mockReturnValue(now);
  state.listUsers.mockResolvedValue({ data: { users: [
    user("new-active", "2026-10-14T06:00:00Z", "2026-10-14T06:00:00Z"), user("used"),
    user("inactive-edited", undefined, "2026-09-01T06:00:00Z"), user("never-used", "2026-10-14T06:00:00Z"),
    { ...user("demo", undefined, "2026-10-14T06:00:00Z"), email: "investor@myflove.se" },
  ] }, error: null });
});
afterEach(() => vi.restoreAllMocks());
describe("Active account statistics", () => {
  it("counts active accounts and their signup dates without treating metadata edits or registrations as use", async () => {
    const data = await summary({ context });
    expect(data.activeUsers30d).toBe(2);
    expect(data.activeNewUsers7d).toBe(1);
    expect(data.activeDailySignups?.find(row => row.date === "2026-10-14")?.users).toBe(1);
    // Anonymous activity is still counted independently; no account/session join is added.
    expect(data.totalSessions).toBe(1);
    expect(data.totalUsers).toBe(4); // historic field remains accurate for existing API consumers
  });
  it("defaults the audit to recent activity and exposes older history only on explicit request", async () => {
    const current = await audit({ context });
    expect(current.activityDays).toBe(30);
    expect(current.activeRegisteredUsers).toBe(2);
    expect(current.sessions.map(row => row.sessionId)).toEqual(["anonymous"]);
    const historic = await audit({ context, data: { days: 400 } });
    expect(historic.activityDays).toBe(400);
    expect(historic.activeRegisteredUsers).toBe(3);
    expect(historic.sessions).toHaveLength(2);
  });
  it("reports unavailable activity as unknown instead of a false zero", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {}); state.usageError = true;
    const data = await summary({ context });
    expect(data.activeUsers30d).toBeNull();
    expect(data.activeNewUsers7d).toBeNull();
    expect(data.activeDailySignups).toBeNull();
  });
  it("rejects unauthorized requests before privileged account or event reads", async () => {
    state.admin = false;
    await expect(summary({ context })).rejects.toThrow("Forbidden");
    await expect(audit({ context })).rejects.toThrow("Forbidden");
    expect(state.listUsers).not.toHaveBeenCalled(); expect(state.eventReads).toBe(0);
  });
});
