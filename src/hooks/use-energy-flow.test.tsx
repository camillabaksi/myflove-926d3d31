import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";

type Row = {
  id: string;
  title: string;
  direction: string;
  strength: number;
  category: string;
  kind: string;
  friction: number | null;
  note: string | null;
  counts_toward_score: boolean;
  occurred_at: string;
  user_id: string;
};
const db = vi.hoisted(() => ({
  userId: "u1",
  rows: [] as Row[],
  writes: [] as Partial<Row>[],
  reads: 0,
  readGate: null as Promise<{ data: Row[]; error: null }> | null,
  writeGate: null as Promise<void> | null,
  auth: [] as ((event: string, session: { user: { id: string } } | null) => void)[],
  updateError: null as Error | null,
  filters: [] as [string, string][],
  realtime: [] as (() => void)[],
}));
vi.mock("@/lib/cloud-storage", () => ({
  ACCOUNT_BOUND_EVENT: "myflove-account-bound",
  getSyncUser: async () =>
    window.localStorage.getItem("myflove-data-owner") === db.userId ? { id: db.userId } : null,
  useCloudSyncedStorage: <T,>(_key: string, initial: T) => useState(initial),
}));
vi.mock("@/lib/account-realtime", () => ({
  subscribeToAccountTable: (table: string, _uid: string, callback: () => void) => {
    if (table === "energy_factors") db.realtime.push(callback);
    return () => {
      db.realtime = db.realtime.filter((fn) => fn !== callback);
    };
  },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: (typeof db.auth)[number]) => {
        db.auth.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    from: (table: string) => {
      let lower: string | null = null;
      let upper: string | null = null;
      let slice: [number, number] | null = null;
      const query = {
        select: () => query,
        eq: () => query,
        gte: (_key: string, value: string) => { lower = value; return query; },
        lt: (_key: string, value: string) => { upper = value; return query; },
        range: (start: number, end: number) => { slice = [start, end]; return query; },
        order: () => query,
        limit: () => query,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
          if (table === "energy_factors") db.reads++;
          return (
            table === "energy_factors"
              ? (db.readGate ?? Promise.resolve({ data: db.rows.filter((row) => (!lower || row.occurred_at >= lower) && (!upper || row.occurred_at < upper)).slice(slice?.[0] ?? 0, slice ? slice[1] + 1 : undefined), error: null }))
              : Promise.resolve({ data: [], error: null })
          ).then(resolve, reject);
        },
      };
      const save = (payload: Partial<Row>) => ({
        select: () => ({
          single: async () => {
            db.writes.push(payload);
            await db.writeGate;
            const row = {
              ...payload,
              id: payload.id ?? crypto.randomUUID(),
              counts_toward_score: true,
            } as Row;
            db.rows = [...db.rows.filter((entry) => entry.id !== row.id), row];
            return { data: row, error: null };
          },
        }),
      });
      return { ...query, insert: save, upsert: save, update: (patch: Partial<Row>) => {
        const filters: [string, string][] = [];
        const mutation = {
          eq: (key: string, value: string) => { filters.push([key, value]); return mutation; },
          then: (resolve: (value: unknown) => unknown) => {
            db.filters = filters;
            if (!db.updateError) db.rows = db.rows.map((row) => filters.every(([key, value]) => row[key] === value) ? { ...row, ...patch } : row);
            return Promise.resolve({ error: db.updateError }).then(resolve);
          },
        };
        return mutation;
      } };
    },
  },
}));
import { useEnergyFlow } from "@/hooks/use-energy-flow";

const input = {
  id: "c511f783-bdf4-4bce-b9d0-f7b07426a538",
  title: "Promenad",
  direction: "drains" as const,
  strength: 4,
  category: "annat" as const,
  kind: "planerat" as const,
  occurredAt: "2026-10-11T09:00:00.000Z",
};
beforeEach(() => {
  db.auth.forEach((callback) => callback("SIGNED_OUT", null));
  db.updateError = null;
  db.filters = [];
  db.userId = "u1";
  db.rows = [];
  db.writes = [];
  db.reads = 0;
  db.readGate = null;
  db.writeGate = null;
  db.realtime = [];
  window.localStorage.setItem("myflove-data-owner", "u1");
});

describe("energipåverkan från en aktivitet", () => {
  it("läser kontot igen efter att enhetens data har knutits till sessionen", async () => {
    window.localStorage.removeItem("myflove-data-owner");
    const view = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    expect(view.result.current.signedIn).toBe(false);
    window.localStorage.setItem("myflove-data-owner", "u1");
    act(() => window.dispatchEvent(new Event("myflove-account-bound")));
    await waitFor(() => expect(view.result.current.signedIn).toBe(true));
    await act(async () => {
      await view.result.current.addFactor(input);
    });
    expect(db.rows).toHaveLength(1);
  });

  it("flyttar inte ett tidigt tryck till ett nytt konto medan laddningen pågår", async () => {
    let finish!: (value: { data: Row[]; error: null }) => void;
    db.readGate = new Promise((resolve) => {
      finish = resolve;
    });
    const view = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(db.reads).toBe(1));
    const saving = view.result.current.addFactor(input);
    act(() => db.auth.forEach((callback) => callback("SIGNED_OUT", null)));
    db.userId = "u2";
    window.localStorage.setItem("myflove-data-owner", "u2");
    db.readGate = null;
    act(() => window.dispatchEvent(new Event("myflove-account-bound")));
    await waitFor(() => expect(view.result.current.signedIn).toBe(true));
    await act(async () => {
      finish({ data: [], error: null });
      expect(await saving).toBeNull();
    });
    expect(db.writes).toHaveLength(0);
  });
  it("väntar på den första laddningen och visar sparningen i alla öppna vyer", async () => {
    let finish!: (value: { data: Row[]; error: null }) => void;
    db.readGate = new Promise((resolve) => {
      finish = resolve;
    });
    const writer = renderHook(() => useEnergyFlow());
    const reader = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(db.reads).toBe(1));
    const saving = writer.result.current.addFactor(input);
    expect(db.writes).toHaveLength(0);
    await act(async () => {
      finish({ data: [], error: null });
      await saving;
    });
    expect(db.rows).toHaveLength(1);
    expect(reader.result.current.entries[0].direction).toBe("drains");
  });

  it("sparar ett ändrat svar och en retry i samma post", async () => {
    const view = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    await act(async () => {
      await view.result.current.addFactor(input);
    });
    await act(async () => {
      await view.result.current.addFactor(input);
    });
    await act(async () => {
      await view.result.current.addFactor({ ...input, direction: "gives" });
    });
    expect(db.rows).toHaveLength(1);
    expect(view.result.current.entries).toHaveLength(1);
    expect(view.result.current.entries[0].direction).toBe("gives");
    expect(view.result.current.entries[0].occurredAt).toBe(input.occurredAt);
  });

  it("behåller en sparning när ett äldre realtidssvar anländer senare", async () => {
    const view = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    let finishWrite!: () => void;
    db.writeGate = new Promise((resolve) => {
      finishWrite = resolve;
    });
    let saving!: ReturnType<typeof view.result.current.addFactor>;
    await act(async () => {
      saving = view.result.current.addFactor(input);
    });
    await waitFor(() => expect(db.writes).toHaveLength(1));
    let finishRead!: (value: { data: Row[]; error: null }) => void;
    db.readGate = new Promise((resolve) => {
      finishRead = resolve;
    });
    act(() => db.realtime.forEach((callback) => callback()));
    await waitFor(() => expect(db.reads).toBe(2));
    await act(async () => {
      finishWrite();
      await saving;
    });
    await act(async () => finishRead({ data: [], error: null }));
    expect(view.result.current.entries).toHaveLength(1);
  });

  it("låter inte en sparning från ett tidigare konto hamna i nästa kontos vy", async () => {
    const view = renderHook(() => useEnergyFlow());
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    let finish!: () => void;
    db.writeGate = new Promise((resolve) => {
      finish = resolve;
    });
    const saving = view.result.current.addFactor(input);
    const rejected = expect(saving).rejects.toThrow("Kontot ändrades");
    await waitFor(() => expect(db.writes).toHaveLength(1));
    act(() => db.auth.forEach((callback) => callback("SIGNED_OUT", null)));
    db.userId = "u2";
    window.localStorage.setItem("myflove-data-owner", "u2");
    await act(async () => {
      finish();
      await rejected;
    });
    expect(view.result.current.entries).toHaveLength(0);
  });
});


it("hämtar en äldre lokal dag utan att ta med grannens datum", async () => {
  db.rows = [
    { ...input, friction: null, note: null, counts_toward_score: true, id: "old", occurred_at: new Date(2026, 0, 2, 12).toISOString(), user_id: "u1" } as Row,
    { ...input, friction: null, note: null, counts_toward_score: true, id: "next", occurred_at: new Date(2026, 0, 3, 12).toISOString(), user_id: "u1" } as Row,
  ];
  const view = renderHook(() => useEnergyFlow());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  expect(view.result.current.entries).toHaveLength(0);
  await act(async () => { await view.result.current.loadDay("2026-01-02"); });
  expect(view.result.current.entries.map((entry) => entry.id)).toEqual(["old"]);
});

it("rättar samma post med kontofilter och återställer den vid sparfel", async () => {
  const view = renderHook(() => useEnergyFlow());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  await act(async () => { await view.result.current.addFactor(input); });
  await act(async () => { await view.result.current.updateFactor(input.id, { strength: 1 }); });
  expect(view.result.current.entries[0].strength).toBe(1);
  expect(db.filters).toContainEqual(["user_id", "u1"]);
  db.updateError = new Error("Offline");
  await act(async () => { await expect(view.result.current.updateFactor(input.id, { strength: 5 })).rejects.toThrow("Offline"); });
  expect(view.result.current.entries[0].strength).toBe(1);
});

it("hämtar även poster efter den första sidan på en äldre dag", async () => {
  db.rows = Array.from({ length: 501 }, (_, index) => ({ ...input, friction: null, note: null, counts_toward_score: true, id: `old-${index}`, occurred_at: new Date(2026, 0, 2, 12).toISOString(), user_id: "u1" }) as Row);
  const view = renderHook(() => useEnergyFlow());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  await act(async () => { await view.result.current.loadDay("2026-01-02"); });
  expect(view.result.current.entries).toHaveLength(501);
});

it("lägger inte en gammal dags svar i nästa kontos vy", async () => {
  const view = renderHook(() => useEnergyFlow());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  let finish!: (value: { data: Row[]; error: null }) => void;
  db.readGate = new Promise((resolve) => { finish = resolve; });
  const reading = view.result.current.loadDay("2026-01-02");
  const rejected = expect(reading).rejects.toThrow("Kontot ändrades");
  await waitFor(() => expect(db.reads).toBe(2));
  act(() => db.auth.forEach((callback) => callback("SIGNED_OUT", null)));
  await act(async () => {
    finish({ data: [{ ...input, friction: null, note: null, counts_toward_score: true, id: "old", occurred_at: new Date(2026, 0, 2, 12).toISOString(), user_id: "u1" } as Row], error: null });
    await rejected;
  });
  expect(view.result.current.entries).toHaveLength(0);
});
