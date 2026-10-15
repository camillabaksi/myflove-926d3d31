import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPilotUsageFn } from "./pilot-statistics.functions";
import { getUserFunnelFn } from "./user-funnel.functions";

const state = vi.hoisted(() => ({ admin: true, failTable: "", rows: {} as Record<string, Array<Record<string, unknown>>>, users: [] as Array<Record<string, unknown>>, reads: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, handler: (fn: unknown) => fn }; return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { admin: { listUsers: async ({ page, perPage }: { page: number; perPage: number }) => {
    state.reads("auth"); return { data: { users: state.users.slice((page - 1) * perPage, page * perPage) }, error: null };
  } } },
  from: (table: string) => {
    state.reads(table);
    const query = { select: () => query, eq: () => query, gte: () => query, lte: () => query, order: () => query,
      range: async (from: number, to: number) => ({ data: (state.rows[table] ?? []).slice(from, to + 1), error: state.failTable === table ? { message: "unavailable" } : null }) };
    return query;
  },
} }));
const context = { userId: "admin", supabase: { from: () => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state.admin ? { role: "admin" } : null }) }; return query;
} } };
const usage = getPilotUsageFn as unknown as (args: { context: typeof context }) => ReturnType<typeof getPilotUsageFn>;
const accounts = getUserFunnelFn as unknown as (args: { context: typeof context }) => ReturnType<typeof getUserFunnelFn>;
beforeEach(() => {
  vi.clearAllMocks(); state.admin = true; state.failTable = ""; state.rows = {}; state.users = [];
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-15T12:00:00Z"));
});
afterEach(() => vi.restoreAllMocks());

describe("Authorized, complete pilot reads", () => {
  it("rejects non-admins before any privileged reads", async () => {
    state.admin = false;
    await expect(usage({ context })).rejects.toThrow("Forbidden");
    await expect(accounts({ context })).rejects.toThrow("Forbidden");
    expect(state.reads).not.toHaveBeenCalled();
  });
  it("reads every event and classification page without looking up identities", async () => {
    state.rows.analytics_events = Array.from({ length: 1001 }, (_, i) => ({ session_id: `s${i}`, action: "task_created", created_at: "2026-10-14T12:00:00Z" }));
    state.rows.analytics_session_owners = Array.from({ length: 1001 }, (_, i) => ({ session_id: i === 1000 ? "s1000" : `other${i}`, is_internal: true }));
    const data = await usage({ context });
    expect(data.meaningfulBrowsers).toBe(1000);
    expect(data.internalBrowsersExcluded).toBe(1);
    expect(new Set(state.reads.mock.calls.map(([table]) => table))).toEqual(new Set(["analytics_events", "analytics_session_owners"]));
  });
  it("paginates accounts and admin roles and uses observed activity for persistent logins", async () => {
    state.users = Array.from({ length: 201 }, (_, i) => ({ id: `u${i}`, email: `u${i}@example.test`, created_at: "2026-01-01T00:00:00Z", last_sign_in_at: "2026-08-01T00:00:00Z", user_metadata: {} }));
    state.rows.user_last_active = [{ user_id: "u199", last_active_at: "2026-10-14T12:00:00Z" }, { user_id: "u200", last_active_at: "2026-10-14T12:00:00Z" }];
    state.rows.user_roles = Array.from({ length: 1001 }, (_, i) => ({ user_id: i === 1000 ? "u200" : `other${i}` }));
    const data = await accounts({ context });
    expect(data.active30d).toBe(1);
    expect(data.history).toEqual({ registered: 200, inactive: 199, internal: 1 });
    expect(state.reads).not.toHaveBeenCalledWith("user_kv");
    expect(state.reads).not.toHaveBeenCalledWith("energy_logs");
  });
  it("fails closed on incomplete classifications or activity rather than returning false counts", async () => {
    state.failTable = "analytics_session_owners";
    await expect(usage({ context })).rejects.toThrow("unavailable");
    state.failTable = "user_last_active";
    await expect(accounts({ context })).rejects.toThrow("unavailable");
    state.failTable = "user_roles";
    await expect(accounts({ context })).rejects.toThrow("unavailable");
  });
});
