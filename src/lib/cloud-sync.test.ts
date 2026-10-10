import { beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal user_kv i minnet med updated_at som sätts av "servern". */
type Row = { value: unknown; updated_at: string };
const db = new Map<string, Row>();
let offline = false;
let clock = Date.parse("2026-10-02T08:00:00Z");
/** Körs mellan läsning och skrivning – simulerar en annan enhet som hinner före. */
let beforeNextUpdate: (() => void | Promise<void>) | null = null;
let beforeNextInsert: (() => void | Promise<void>) | null = null;
let beforeNextRead: (() => void | Promise<void>) | null = null;
let getUserImpl = async () => ({ data: { user: { id: "A" } } });
let authStateChanged: (event: string, session: { user: { id: string } } | null) => void;

function serverWrite(key: string, value: unknown) {
  clock += 1000;
  db.set(key, { value, updated_at: new Date(clock).toISOString() });
}

function netError() {
  return { data: null, error: { message: "Failed to fetch" } };
}

function from() {
  const filters: Record<string, string> = {};
  const chain = {
    select: () => chain,
    eq: (col: string, v: string) => {
      filters[col] = v;
      return chain;
    },
    maybeSingle: async () => {
      if (offline) return netError();
      const row = db.get(filters.key) ?? null;
      if (beforeNextRead) {
        const f = beforeNextRead;
        beforeNextRead = null;
        await f();
      }
      return { data: row, error: null };
    },
    update: (vals: { value: unknown }) => {
      const u = {
        eq: (col: string, v: string) => {
          filters[col] = v;
          return u;
        },
        select: async () => {
          if (offline) return netError();
          if (beforeNextUpdate) {
            const f = beforeNextUpdate;
            beforeNextUpdate = null;
            await f();
          }
          const row = db.get(filters.key);
          if (!row || row.updated_at !== filters.updated_at) return { data: [], error: null };
          serverWrite(filters.key, vals.value);
          return { data: [{ updated_at: db.get(filters.key)!.updated_at }], error: null };
        },
      };
      return u;
    },
    insert: (vals: { key: string; value: unknown }) => ({
      select: async () => {
        if (offline) return netError();
        if (beforeNextInsert) {
          const f = beforeNextInsert;
          beforeNextInsert = null;
          await f();
        }
        if (db.has(vals.key)) return { data: null, error: { code: "23505" } };
        serverWrite(vals.key, vals.value);
        return { data: [{ updated_at: db.get(vals.key)!.updated_at }], error: null };
      },
    }),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => getUserImpl(),
      onAuthStateChange: (callback: typeof authStateChanged) => {
        authStateChanged = callback;
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
    from: () => from(),
    channel: () => ({ on: () => ({ subscribe: () => undefined }) }),
    removeChannel: () => undefined,
  },
}));

const cs = await import("@/lib/cloud-storage");
const KEY = "myflow-tasks";
type Task = { id: string; title: string };

const local = (): Task[] => JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
const cloud = (): Task[] => (db.get(KEY)?.value as Task[]) ?? [];
const ids = (list: Task[]) => list.map((t) => t.id).sort();

beforeEach(() => {
  db.clear();
  offline = false;
  beforeNextUpdate = null;
  beforeNextInsert = null;
  beforeNextRead = null;
  getUserImpl = async () => ({ data: { user: { id: "A" } } });
  window.localStorage.clear();
  window.localStorage.setItem("myflove-data-owner", "A");
  cs.__resetCloudSync();
  cs.__registerKeyForTest(KEY, []);
});

describe("molnsynk", () => {
  it("nätverksfel: ändringen behålls som osynkad och skickas vid återanslutning", async () => {
    offline = true;
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Handla" }]);
    await cs.requestSync(KEY);
    expect(cs.getCloudSyncStatus()).toBe("error");
    expect(cs.hasUnsyncedCloudData(KEY)).toBe(true);
    expect(db.has(KEY)).toBe(false);

    offline = false;
    await cs.requestSync(KEY);
    expect(ids(cloud())).toEqual(["a"]);
    expect(cs.hasUnsyncedCloudData(KEY)).toBe(false);
    expect(cs.getCloudSyncStatus()).toBe("saved");
  });

  it("återanslutning skriver inte bort poster från en annan enhet", async () => {
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Handla" }]);
    await cs.requestSync(KEY);

    offline = true;
    cs.applyLocalChange<Task[]>(KEY, (prev) => [...prev, { id: "b", title: "Lokal offline" }]);
    await cs.requestSync(KEY);
    // Annan enhet lägger till under tiden.
    serverWrite(KEY, [...cloud(), { id: "c", title: "Från mobilen" }]);

    offline = false;
    await cs.requestSync(KEY);
    expect(ids(cloud())).toEqual(["a", "b", "c"]);
    expect(ids(local())).toEqual(["a", "b", "c"]);
  });

  it("två enheter: tillägg, ändring och borttagning slås ihop utan att något återuppstår", async () => {
    cs.applyLocalChange<Task[]>(KEY, [
      { id: "a", title: "Handla" },
      { id: "b", title: "Tvätta" },
      { id: "c", title: "Ringa" },
    ]);
    await cs.requestSync(KEY);

    // Den här enheten: tar bort a, ändrar b.
    offline = true;
    cs.applyLocalChange<Task[]>(KEY, (prev) =>
      prev
        .filter((t) => t.id !== "a")
        .map((t) => (t.id === "b" ? { ...t, title: "Tvätta lakan" } : t)),
    );
    await cs.requestSync(KEY);
    // Andra enheten: tar bort c, lägger till d.
    serverWrite(KEY, [...cloud().filter((t) => t.id !== "c"), { id: "d", title: "Ny" }]);

    offline = false;
    await cs.requestSync(KEY);
    expect(ids(cloud())).toEqual(["b", "d"]);
    expect(cloud().find((t) => t.id === "b")?.title).toBe("Tvätta lakan");
    expect(ids(local())).toEqual(["b", "d"]);
  });

  it("krock mellan läsning och skrivning: läser om och slår ihop", async () => {
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Handla" }]);
    await cs.requestSync(KEY);

    cs.applyLocalChange<Task[]>(KEY, (prev) => [...prev, { id: "b", title: "Lokal" }]);
    beforeNextUpdate = () => serverWrite(KEY, [...cloud(), { id: "c", title: "Hann före" }]);
    await cs.requestSync(KEY);
    expect(ids(cloud())).toEqual(["a", "b", "c"]);
  });

  it("synkar aldrig när enhetens data ägs av ett annat konto", async () => {
    window.localStorage.setItem("myflove-data-owner", "B");
    cs.applyLocalChange<Task[]>(KEY, [{ id: "x", title: "B:s" }]);
    await cs.requestSync(KEY);
    expect(db.has(KEY)).toBe(false);
  });

  it("ett sent lässvar efter utloggning lägger inte tillbaka kontots data", async () => {
    serverWrite(KEY, [{ id: "private", title: "A:s privata uppgift" }]);
    beforeNextRead = () => {
      authStateChanged("SIGNED_OUT", null);
      window.localStorage.removeItem("myflove-data-owner");
    };
    await cs.requestSync(KEY);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY + "__base")).toBeNull();
  });

  it("ett sent skrivsvar efter utloggning återställer varken värde eller synkmetadata", async () => {
    serverWrite(KEY, [{ id: "cloud", title: "A:s privata molndata" }]);
    cs.applyLocalChange<Task[]>(KEY, [{ id: "local", title: "A:s lokala ändring" }]);
    beforeNextUpdate = () => {
      window.localStorage.clear();
      authStateChanged("SIGNED_OUT", null);
    };
    await cs.requestSync(KEY);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY + "__base")).toBeNull();
    expect(window.localStorage.getItem(KEY + "__synced_at")).toBeNull();
  });

  it("ett sent insertsvar bekräftar inte nästa kontos osynkade ändringar", async () => {
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "A:s uppgift" }]);
    beforeNextInsert = () => {
      authStateChanged("SIGNED_IN", { user: { id: "B" } });
      window.localStorage.clear();
      window.localStorage.setItem("myflove-data-owner", "B");
      cs.applyLocalChange<Task[]>(KEY, [{ id: "b", title: "B:s osynkade uppgift" }]);
    };
    await cs.requestSync(KEY);
    expect(local()).toEqual([{ id: "b", title: "B:s osynkade uppgift" }]);
    expect(cs.hasUnsyncedCloudData(KEY)).toBe(true);
    expect(window.localStorage.getItem(KEY + "__base")).toBeNull();
    expect(window.localStorage.getItem(KEY + "__synced_at")).toBeNull();
  });

  it("ignorerar ett gammalt skrivsvar även när samma konto loggar in igen", async () => {
    serverWrite(KEY, [{ id: "cloud", title: "Gammalt molnvärde" }]);
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Gammal session" }]);
    beforeNextUpdate = () => {
      authStateChanged("SIGNED_OUT", null);
      window.localStorage.clear();
      window.localStorage.setItem("myflove-data-owner", "A");
      authStateChanged("SIGNED_IN", { user: { id: "A" } });
      window.localStorage.setItem(KEY, JSON.stringify([{ id: "new", title: "Ny session" }]));
    };
    await cs.requestSync(KEY);
    expect(local()).toEqual([{ id: "new", title: "Ny session" }]);
    expect(window.localStorage.getItem(KEY + "__base")).toBeNull();
  });

  it("en vanlig tokenförnyelse avbryter inte en pågående synkning", async () => {
    authStateChanged("SIGNED_IN", { user: { id: "A" } });
    serverWrite(KEY, [{ id: "cloud", title: "Från mobilen" }]);
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Lokal" }]);
    beforeNextUpdate = () => authStateChanged("TOKEN_REFRESHED", { user: { id: "A" } });
    await cs.requestSync(KEY);
    expect(ids(local())).toEqual(["a", "cloud"]);
    expect(cs.hasUnsyncedCloudData(KEY)).toBe(false);
  });

  it("ett gammalt nätverksfel efter sessionsbyte påverkar inte nästa kontos status", async () => {
    cs.applyLocalChange<Task[]>(KEY, [{ id: "a", title: "Lokal" }]);
    beforeNextInsert = () => {
      authStateChanged("SIGNED_OUT", null);
      window.localStorage.clear();
      throw new Error("Late network error");
    };
    await cs.requestSync(KEY);
    expect(cs.getCloudSyncStatus()).toBe("saved");
    expect(window.localStorage.getItem(KEY + "__synced_at")).toBeNull();
  });

  it("ett gammalt auth-svar får inte återfylla eller tömma nästa sessions användarcache", async () => {
    let finishOld!: (result: { data: { user: { id: string } } }) => void;
    getUserImpl = () =>
      new Promise((resolve) => {
        finishOld = resolve;
      });
    const oldRequest = cs.getSyncUser();
    authStateChanged("SIGNED_OUT", null);
    window.localStorage.setItem("myflove-data-owner", "B");
    authStateChanged("SIGNED_IN", { user: { id: "B" } });
    getUserImpl = async () => ({ data: { user: { id: "B" } } });
    expect(await cs.getSyncUser()).toEqual({ id: "B" });
    finishOld({ data: { user: { id: "A" } } });
    expect(await oldRequest).toBeNull();
    expect(await cs.getSyncUser()).toEqual({ id: "B" });
  });
});
