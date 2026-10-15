import { beforeEach, describe, expect, it, vi } from "vitest";
import { listUsersWithRolesFn, type AdminUserRow } from "./admin.functions";

const mock = vi.hoisted(() => ({ listUsers: vi.fn(), roles: vi.fn(), admin: true }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (data: unknown): unknown => data;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => { validate = fn; return builder; },
      handler: (fn: (args: Record<string, unknown>) => unknown) => (args: Record<string, unknown>) => fn({ ...args, data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  auth: { admin: { listUsers: mock.listUsers } }, from: () => ({ select: mock.roles }),
} }));
const context = {
  userId: "owner",
  supabase: { from: () => {
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: mock.admin ? { role: "admin" } : null, error: null }) };
    return query;
  } },
};
const call = listUsersWithRolesFn as unknown as (args: { data?: { from?: string; to?: string }; context: typeof context }) => Promise<AdminUserRow[]>;
const account = (id: string, platform?: string) => ({ id, email: `${id}@example.test`, created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z", user_metadata: platform ? { registration_platform: platform } : {} });

beforeEach(() => { vi.clearAllMocks(); mock.admin = true; mock.roles.mockResolvedValue({ data: [{ user_id: "ios", role: "admin" }], error: null }); });
describe("Admin account platform list", () => {
  it("normalizes signup origins, keeps historic accounts unknown and preserves existing roles", async () => {
    mock.listUsers.mockResolvedValue({ data: { users: [account("ios", "ios"), account("older"), account("invalid", "TestFlight")] }, error: null });
    const rows = await call({ context });
    expect(rows.map(row => [row.user_id, row.registration_platform])).toEqual([["ios", "ios"], ["older", "unknown"], ["invalid", "unknown"]]);
    expect(rows[0]?.roles).toEqual(["admin"]);
    expect(rows[0]).not.toHaveProperty("user_metadata");
  });
  it("includes accounts beyond page one and never counts an account twice across pages", async () => {
    const first = Array.from({ length: 200 }, (_, i) => account(`u${i}`, "web"));
    mock.listUsers.mockResolvedValueOnce({ data: { users: first }, error: null })
      .mockResolvedValueOnce({ data: { users: [first[199], account("android", "android")] }, error: null });
    const rows = await call({ context });
    expect(rows).toHaveLength(201);
    expect(rows.find(row => row.user_id === "android")?.registration_platform).toBe("android");
    expect(mock.listUsers.mock.calls.map(([options]) => options)).toEqual([{ page: 1, perPage: 200 }, { page: 2, perPage: 200 }]);
  });
  it("applies the existing period filter before platform totals are returned", async () => {
    mock.listUsers.mockResolvedValue({ data: { users: [account("old", "ios"), { ...account("new", "android"), created_at: "2026-10-15T12:00:00Z" }] }, error: null });
    expect((await call({ context, data: { from: "2026-10-15", to: "2026-10-15" } })).map(row => row.user_id)).toEqual(["new"]);
  });
  it("checks admin access before reading privileged account data", async () => {
    mock.admin = false;
    await expect(call({ context })).rejects.toThrow("Forbidden");
    expect(mock.listUsers).not.toHaveBeenCalled();
  });
  it("reports a failed later page instead of showing incomplete totals", async () => {
    mock.listUsers.mockResolvedValueOnce({ data: { users: Array.from({ length: 200 }, (_, i) => account(`u${i}`)) }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "network" } });
    await expect(call({ context })).rejects.toThrow("network");
  });
});
