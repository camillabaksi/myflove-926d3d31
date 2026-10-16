import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMyWeeklyPulseFn,
  getWeeklyPulseStatsFn,
  updateMyWeeklyPulseFn,
} from "./weekly-pulse.functions";
import { pulseWeekStart } from "./weekly-pulse";

const state = vi.hoisted(() => ({ admin: true, rpc: vi.fn(), reads: vi.fn(), entry: null }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
const owner = "00000000-0000-4000-8000-000000000001";
const filters: Array<[string, unknown]> = [];
const context = {
  userId: owner,
  supabase: {
    rpc: state.rpc,
    from: (table: string) => {
      state.reads(table);
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return query;
        },
        maybeSingle: async () => ({
          data: table === "user_roles" ? (state.admin ? { role: "admin" } : null) : state.entry,
          error: null,
        }),
      };
      return query;
    },
  },
};
const read = getMyWeeklyPulseFn as unknown as (args: {
  context: typeof context;
  data: { expectedUserId: string };
}) => ReturnType<typeof getMyWeeklyPulseFn>;
const update = updateMyWeeklyPulseFn as unknown as (args: {
  context: typeof context;
  data: Record<string, unknown>;
}) => ReturnType<typeof updateMyWeeklyPulseFn>;
const stats = getWeeklyPulseStatsFn as unknown as (args: {
  context: typeof context;
}) => ReturnType<typeof getWeeklyPulseStatsFn>;
beforeEach(() => {
  vi.clearAllMocks();
  state.admin = true;
  state.entry = null;
  filters.length = 0;
  state.rpc.mockResolvedValue({ data: null, error: null });
});
describe("Server-owned weekly pulse boundaries", () => {
  it("rejects an account switch before reads or writes", async () => {
    await expect(read({ context, data: { expectedUserId: "other" } })).rejects.toThrow(
      /Kontot har ändrats/,
    );
    await expect(
      update({
        context,
        data: { expectedUserId: "other", weekStart: pulseWeekStart(), action: "open" },
      }),
    ).rejects.toThrow(/Kontot har ändrats/);
    expect(state.reads).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("reads only the authenticated account and current Swedish week", async () => {
    const result = await read({ context, data: { expectedUserId: owner } });
    expect(result).toEqual({ weekStart: pulseWeekStart(), entry: null });
    expect(filters).toEqual([
      ["user_id", owner],
      ["week_start", pulseWeekStart()],
    ]);
  });
  it("rejects stale weeks before issuing a mutation", async () => {
    await expect(
      update({ context, data: { expectedUserId: owner, weekStart: "2000-01-03", action: "open" } }),
    ).rejects.toThrow(/En ny vecka/);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("passes no owner supplied by the client into the protected database operation", async () => {
    await update({
      context,
      data: {
        expectedUserId: owner,
        weekStart: pulseWeekStart(),
        action: "submit",
        revision: 2,
        consent: true,
        overview: 1,
        relief: 4,
        burden: 5,
      },
    });
    expect(state.rpc).toHaveBeenCalledWith("update_my_weekly_pulse", {
      p_week: pulseWeekStart(),
      p_action: "submit",
      p_revision: 2,
      p_consent: true,
      p_overview: 1,
      p_relief: 4,
      p_burden: 5,
    });
  });
  it("rejects non-admins before requesting any aggregate", async () => {
    state.admin = false;
    await expect(stats({ context })).rejects.toThrow("Forbidden");
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("treats failed or partial statistics as unknown", async () => {
    state.rpc.mockResolvedValueOnce({ error: { message: "unavailable" } });
    await expect(stats({ context })).rejects.toThrow(/kunde inte hämtas/);
    state.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(stats({ context })).rejects.toThrow(/Ofullständigt/);
  });
  it("preserves a stale-edit error rather than claiming that an answer was saved", async () => {
    state.rpc.mockResolvedValueOnce({ error: { code: "40001" } });
    await expect(
      update({
        context,
        data: {
          expectedUserId: owner,
          weekStart: pulseWeekStart(),
          action: "withdraw",
          revision: 1,
        },
      }),
    ).rejects.toThrow(/annan enhet/);
  });
});
