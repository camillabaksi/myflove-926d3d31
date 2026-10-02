import { beforeEach, describe, expect, it, vi } from "vitest";

// Ingen nätverkskontakt: utloggningen ska fungera offline.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.reject(new Error("offline")),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    from: () => {
      throw new Error("offline");
    },
    channel: () => ({ on: () => ({ subscribe: () => undefined }) }),
    removeChannel: () => undefined,
  },
}));

const { bindAccount, parkActiveData, isActiveOwner, getDataOwner } = await import(
  "@/lib/account-scope"
);
const { clearLocalUserData } = await import("@/lib/local-data");
const { hasUnsyncedCloudData } = await import("@/lib/cloud-storage");

const TASKS = "myflow-tasks";

function writeUnsynced(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.localStorage.setItem(`${key}__updated_at`, String(Date.now()));
}

describe("kontoseparering", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("konto A → utloggning offline → konto B → återinloggning som A", async () => {
    // A loggar in och skriver en uppgift som inte hinner synkas.
    expect(bindAccount("A", { adoptUnowned: false })).toBe("adopted");
    writeUnsynced(TASKS, [{ id: "t1", title: "A:s hemliga uppgift" }]);

    // A loggar ut utan nät.
    await clearLocalUserData();
    expect(getDataOwner()).toBeNull();
    expect(window.localStorage.getItem(TASKS)).toBeNull();

    // B loggar in: ser inget av A och får inte synka A:s data.
    bindAccount("B", { adoptUnowned: false });
    expect(window.localStorage.getItem(TASKS)).toBeNull();
    expect(isActiveOwner("A")).toBe(false);
    expect(isActiveOwner("B")).toBe(true);
    writeUnsynced(TASKS, [{ id: "b1", title: "B:s uppgift" }]);

    // B loggar ut, A loggar in igen: A:s osynkade ändring är tillbaka och väntar på synk.
    await clearLocalUserData();
    expect(bindAccount("A", { adoptUnowned: false })).toBe("switched");
    expect(JSON.parse(window.localStorage.getItem(TASKS) ?? "[]")).toEqual([
      { id: "t1", title: "A:s hemliga uppgift" },
    ]);
    expect(hasUnsyncedCloudData(TASKS)).toBe(true);
    // B:s osynkade data ligger kvar i B:s förråd.
    expect(window.localStorage.getItem(`myflove-stash:B:${TASKS}`)).toContain("b1");
  });

  it("kontobyte utan utloggning flyttar undan föregående kontos data", () => {
    bindAccount("A", { adoptUnowned: false });
    writeUnsynced(TASKS, [{ id: "t1" }]);
    expect(bindAccount("B", { adoptUnowned: false })).toBe("switched");
    expect(window.localStorage.getItem(TASKS)).toBeNull();
    expect(window.localStorage.getItem(`myflove-stash:A:${TASKS}`)).toContain("t1");
  });

  it("ägarlös äldre data adopteras av en redan inloggad session", () => {
    writeUnsynced(TASKS, [{ id: "legacy" }]);
    expect(bindAccount("A", { adoptUnowned: true })).toBe("adopted");
    expect(window.localStorage.getItem(TASKS)).toContain("legacy");
  });

  it("ägarlös äldre data gissas inte till ett nytt konto", () => {
    writeUnsynced(TASKS, [{ id: "legacy" }]);
    bindAccount("B", { adoptUnowned: false });
    expect(window.localStorage.getItem(TASKS)).toBeNull();
    expect(window.localStorage.getItem(`myflove-stash:unowned:${TASKS}`)).toContain("legacy");
  });

  it("sessionen tar slut utan utloggning: allt parkeras hos ägaren", () => {
    bindAccount("A", { adoptUnowned: false });
    window.localStorage.setItem("myflove-notes", "[1]");
    parkActiveData();
    expect(getDataOwner()).toBeNull();
    expect(window.localStorage.getItem("myflove-notes")).toBeNull();
    expect(window.localStorage.getItem("myflove-stash:A:myflove-notes")).toBe("[1]");
  });

  it("förråd och ägarmarkering räknas inte som aktiv data", async () => {
    bindAccount("A", { adoptUnowned: false });
    window.localStorage.setItem("myflove-stash:B:myflove-notes", "[2]");
    await clearLocalUserData();
    expect(window.localStorage.getItem("myflove-stash:B:myflove-notes")).toBe("[2]");
  });
});
