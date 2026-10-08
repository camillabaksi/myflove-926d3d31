import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

type Row = { value: unknown; updated_at: string };
const db = new Map<string, Row>();
const writes: { user: string; key: string }[] = [];
let offline = false;
let clock = 1;

function from() {
  const f: Record<string, string> = {};
  const err = { data: null, error: { message: "Failed to fetch" } };
  const chain = {
    select: () => chain,
    eq: (c: string, v: string) => ((f[c] = v), chain),
    maybeSingle: async () => (offline ? err : { data: db.get(f.key) ?? null, error: null }),
    update: (vals: { value: unknown }) => {
      const u = {
        eq: (c: string, v: string) => ((f[c] = v), u),
        select: async () => {
          if (offline) return err;
          writes.push({ user: f.user_id, key: f.key });
          db.set(f.key, { value: vals.value, updated_at: String(++clock) });
          return { data: [{ updated_at: String(clock) }], error: null };
        },
      };
      return u;
    },
    insert: (vals: { user_id: string; key: string; value: unknown }) => ({
      select: async () => {
        if (offline) return err;
        writes.push({ user: vals.user_id, key: vals.key });
        db.set(vals.key, { value: vals.value, updated_at: String(++clock) });
        return { data: [{ updated_at: String(clock) }], error: null };
      },
    }),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: "A", email: "camillabaksi@example.com", user_metadata: {} } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    from: () => from(),
    channel: () => ({ on: () => ({ subscribe: () => undefined }) }),
    removeChannel: () => undefined,
  },
}));

const cs = await import("@/lib/cloud-storage");
const { useUserProfile, NAME_KEY } = await import("@/hooks/use-user-profile");

beforeEach(() => {
  db.clear();
  writes.length = 0;
  offline = false;
  window.localStorage.clear();
  window.localStorage.setItem("myflove-data-owner", "A");
  cs.__resetCloudSync();
});

describe("visningsnamn", () => {
  it("visar e-postgissning som tillfälligt förslag men sparar den aldrig", async () => {
    const { result } = renderHook(() => useUserProfile());
    await waitFor(() => expect(result.current.name).toBe("Camillabaksi"));
    expect(result.current.hasChosenName).toBe(false);
    expect(window.localStorage.getItem(NAME_KEY)).toBeNull();
    expect(db.has(NAME_KEY)).toBe(false);
  });

  it("sparar valt namn endast på rätt konto och nyckel, och prioriterar det", async () => {
    const { result } = renderHook(() => useUserProfile());
    let ok = false;
    await act(async () => {
      ok = await result.current.saveName("  Camilla!  ");
    });
    expect(ok).toBe(true);
    expect(result.current.name).toBe("Camilla!");
    expect(result.current.hasChosenName).toBe(true);
    expect(db.get(NAME_KEY)?.value).toBe("Camilla!");
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.every((w) => w.user === "A" && w.key === NAME_KEY)).toBe(true);
  });

  it("vid misslyckad synk behålls tidigare namn och fel returneras", async () => {
    const { result } = renderHook(() => useUserProfile());
    await act(async () => {
      await result.current.saveName("Camilla");
    });
    offline = true;
    let ok = true;
    await act(async () => {
      ok = await result.current.saveName("Annat");
    });
    expect(ok).toBe(false);
    expect(result.current.name).toBe("Camilla");
    expect(db.get(NAME_KEY)?.value).toBe("Camilla");
  });

  it("avvisar namn som bara är mellanslag", async () => {
    const { result } = renderHook(() => useUserProfile());
    let ok = true;
    await act(async () => {
      ok = await result.current.saveName("   ");
    });
    expect(ok).toBe(false);
    expect(window.localStorage.getItem(NAME_KEY)).toBeNull();
  });

  it("en fördröjd äldre sparning skriver inte över ett senare val", async () => {
    const { result } = renderHook(() => useUserProfile());
    await act(async () => {
      const first = result.current.saveName("Första");
      const second = result.current.saveName("Andra");
      await Promise.all([first, second]);
    });
    expect(result.current.name).toBe("Andra");
    expect(db.get(NAME_KEY)?.value).toBe("Andra");
  });
});
