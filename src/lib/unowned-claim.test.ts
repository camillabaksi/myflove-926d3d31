import { beforeEach, describe, expect, it } from "vitest";
import { STASH_PREFIX, UNOWNED, DATA_OWNER_KEY, claimUnownedStash, unownedStashCount, discardUnownedStash } from "./account-scope";

const sk = (k: string) => `${STASH_PREFIX}${UNOWNED}:${k}`;

describe("återställning av äldre ägarlös data", () => {
  beforeEach(() => localStorage.clear());

  it("slår ihop listor utan att skriva över och markerar som osynkat", () => {
    localStorage.setItem(DATA_OWNER_KEY, "user-a");
    localStorage.setItem("myflow-tasks", JSON.stringify([{ id: "1", title: "Kontots" }]));
    localStorage.setItem(sk("myflow-tasks"), JSON.stringify([{ id: "1", title: "Gammal" }, { id: "2", title: "Ny" }]));
    localStorage.setItem(sk("myflow-tasks__synced_at"), "999");
    localStorage.setItem(sk("myflove-notes"), JSON.stringify({ a: 1 }));
    expect(unownedStashCount()).toBe(2);
    expect(claimUnownedStash().restored).toBe(2);
    const tasks = JSON.parse(localStorage.getItem("myflow-tasks")!);
    expect(tasks).toEqual([{ id: "1", title: "Kontots" }, { id: "2", title: "Ny" }]);
    expect(localStorage.getItem("myflow-tasks__synced_at")).toBeNull();
    expect(Number(localStorage.getItem("myflow-tasks__updated_at"))).toBeGreaterThan(0);
    expect(localStorage.getItem("myflove-notes")).toBe(JSON.stringify({ a: 1 }));
    expect(unownedStashCount()).toBe(0);
  });

  it("gör inget utan inloggad ägare", () => {
    localStorage.setItem(sk("myflow-tasks"), "[]");
    expect(claimUnownedStash().restored).toBe(0);
    expect(unownedStashCount()).toBe(1);
    discardUnownedStash();
    expect(unownedStashCount()).toBe(0);
  });
});
