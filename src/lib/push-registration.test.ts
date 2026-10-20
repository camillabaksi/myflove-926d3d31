import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown): unknown => value;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => {
        validate = fn;
        return builder;
      },
      handler:
        (fn: (args: Record<string, unknown>) => unknown) => (args: Record<string, unknown>) =>
          fn({ ...args, data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

import { subscribeToPush } from "./push.functions";

type Row = Record<string, string | null>;
let rows: Row[];
let saveError: { message: string } | null;
const context = {
  userId: "account-a",
  supabase: {
    from: () => ({
      upsert: async (row: Row) => {
        if (saveError) return { error: saveError };
        const existing = rows.findIndex((item) => item.endpoint === row.endpoint);
        if (existing >= 0) rows[existing] = row;
        else rows.push(row);
        return { error: null };
      },
      // Modellera den tidigare rensningen så testet fångar verklig dataförlust.
      delete: () => {
        const filters: [string, string, boolean][] = [];
        const chain = {
          eq: (key: string, value: string) => {
            filters.push([key, value, true]);
            return chain;
          },
          neq: async (key: string, value: string) => {
            filters.push([key, value, false]);
            rows = rows.filter(
              (row) => !filters.every(([k, v, equal]) => (row[k] === v) === equal),
            );
            return { error: null };
          },
        };
        return chain;
      },
    }),
  },
};
const call = subscribeToPush as unknown as (args: {
  data: Record<string, unknown>;
  context: typeof context;
}) => Promise<{ ok: boolean }>;

beforeEach(() => {
  saveError = null;
  rows = [
    { user_id: "account-a", endpoint: "https://fcm.googleapis.com/android", user_agent: "same-browser" },
  ];
});

describe("registrering av flera enheter", () => {
  it("behåller en annan enhet även när en äldre klient begär UA-rensning", async () => {
    await call({
      context,
      data: {
        endpoint: "https://fcm.googleapis.com/web",
        p256dh: "key",
        auth: "auth",
        userAgent: "same-browser",
        replaceOthers: true,
      },
    });
    expect(rows.map((row) => row.endpoint)).toEqual([
      "https://fcm.googleapis.com/android",
      "https://fcm.googleapis.com/web",
    ]);
    expect(rows[1].user_id).toBe("account-a");
  });

  it("uppdaterar samma endpoint utan dubbletter eller borttagning av andra", async () => {
    await call({
      context,
      data: { endpoint: "https://fcm.googleapis.com/android", p256dh: "new-key", auth: "new-auth" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].p256dh).toBe("new-key");
  });

  it("signalerar databasfel och behåller tidigare enheter", async () => {
    saveError = { message: "Save failed" };
    await expect(
      call({ context, data: { endpoint: "https://fcm.googleapis.com/web", p256dh: "key", auth: "auth" } }),
    ).rejects.toThrow("Save failed");
    expect(rows.map((row) => row.endpoint)).toEqual(["https://fcm.googleapis.com/android"]);
  });
});
