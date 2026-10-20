import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChildren } from "./use-children";
import { draftPlanningLines } from "@/lib/planning";

const db = vi.hoisted(() => ({
  owner: "owner",
  rows: [] as any[],
  shares: [] as any[],
  calls: [] as any[],
  failAfterInsert: false,
  hideReadback: false,
}));
vi.mock("@/lib/cloud-storage", () => ({ getSyncUser: async () => ({ id: db.owner }) }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (id: string) => id === db.owner }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: db.owner } } }),
      getSession: async () => ({ data: { session: { user: { id: db.owner } } } }),
      onAuthStateChange: vi.fn(),
    },
    rpc: async () => ({ data: [], error: null }),
    channel: () => {
      const channel: any = { on: () => channel, subscribe: () => channel };
      return channel;
    },
    removeChannel: vi.fn(),
    from: (table: string) => {
      let owner: string | undefined, ids: string[] | undefined;
      const query: any = {
        select: () => query,
        order: () => query,
        range: () => query,
        eq: (key: string, value: string) => {
          if (key === "owner_id") owner = value;
          return query;
        },
        in: (_key: string, value: string[]) => {
          ids = value;
          return query;
        },
        then: (resolve: any, reject: any) => {
          let data: any[] =
            table === "children"
              ? ["bella", "bianca"].map((id) => ({ id, name: id, owner_id: db.owner }))
              : table === "child_items"
                ? db.rows
                : table === "child_item_shares"
                  ? db.shares
                  : [];
          if (owner) data = data.filter((row) => row.owner_id === owner);
          if (ids) data = db.hideReadback ? [] : data.filter((row) => ids!.includes(row.id));
          return Promise.resolve({ data: structuredClone(data), error: null }).then(
            resolve,
            reject,
          );
        },
        upsert: async (rows: any[], options: unknown) => {
          db.calls.push({ rows: structuredClone(rows), options });
          for (const row of rows)
            if (!db.rows.some((saved) => saved.id === row.id))
              db.rows.push({ ...row, file_path: null, created_at: "", updated_at: "" });
          if (db.failAfterInsert) {
            db.failAfterInsert = false;
            return { error: { message: "Network response lost" } };
          }
          return { error: null };
        },
      };
      return query;
    },
  },
}));

beforeEach(() => {
  db.owner = "owner";
  db.rows = [];
  db.shares = [];
  db.calls = [];
  db.failAfterInsert = false;
  db.hideReadback = false;
});
async function loaded() {
  const hook = renderHook(() => useChildren());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}
describe("Child planning writes", () => {
  it("retries a lost response using the same IDs, without duplicate records or resetting shares", async () => {
    const hook = await loaded();
    const rows = draftPlanningLines("Frukost\nSimskola", "2026-10-17", ["bella", "bianca"]);
    db.failAfterInsert = true;
    await act(async () => {
      await expect(hook.result.current.addPlannedActivities(rows, "owner")).rejects.toBeTruthy();
    });
    expect(db.rows).toHaveLength(4);
    db.shares = [{ item_id: db.rows[0]!.id, user_id: "explicit-viewer", notify: true }];
    await act(async () => {
      await hook.result.current.addPlannedActivities(rows, "owner");
    });
    expect(db.rows).toHaveLength(4);
    expect(db.calls[0].rows).toEqual(db.calls[1].rows);
    expect(db.calls[1].options).toEqual({ onConflict: "id", ignoreDuplicates: true });
    expect(hook.result.current.items.find((row) => row.id === db.rows[0].id)?.sharedWith).toEqual([
      "explicit-viewer",
    ]);
  });
  it("does not confirm missing rows, and never inserts for a different account or foreign child", async () => {
    const hook = await loaded();
    const rows = draftPlanningLines("Frukost", "2026-10-17", ["bella"]);
    db.hideReadback = true;
    await act(async () => {
      await expect(hook.result.current.addPlannedActivities(rows, "owner")).rejects.toThrow(
        /bekräftas/,
      );
    });
    db.hideReadback = false;
    const before = db.calls.length;
    await expect(
      hook.result.current.addPlannedActivities(
        draftPlanningLines("Annat", "2026-10-17", ["foreign"]),
        "owner",
      ),
    ).rejects.toThrow();
    db.owner = "other";
    await expect(hook.result.current.addPlannedActivities(rows, "owner")).rejects.toThrow(/Kontot/);
    expect(db.calls).toHaveLength(before);
  });
});
