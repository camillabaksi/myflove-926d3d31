import { describe, it, expect, beforeEach } from "vitest";
import { clearLocalUserData, isUserDataKey } from "@/lib/local-data";

describe("lokal användardata", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("räknar personlig data som användardata", () => {
    expect(isUserDataKey("myflove-energy-flow")).toBe(true);
    expect(isUserDataKey("myflove-medications")).toBe(true);
    expect(isUserDataKey("myflow-home-shortcuts")).toBe(true);
    expect(isUserDataKey("sb-abc-auth-token")).toBe(true);
  });

  it("lämnar enhetsinställningar i fred", () => {
    expect(isUserDataKey("myflove-theme")).toBe(false);
    expect(isUserDataKey("cookie-consent")).toBe(false);
  });

  it("lämnar namn och morgon/kväll-batteri kvar vid utloggning", async () => {
    expect(isUserDataKey("myflove-preferred-name")).toBe(false);
    expect(isUserDataKey("myflove-day-window")).toBe(false);
    expect(isUserDataKey("myflove-day-edges")).toBe(false);

    window.localStorage.setItem("myflove-preferred-name", "Camilla");
    window.localStorage.setItem(
      "myflove-day-window",
      JSON.stringify({ start: "07:00", end: "22:00" }),
    );
    window.localStorage.setItem(
      "myflove-day-edges",
      JSON.stringify({ "2026-08-31": { morning: 6, evening: 3 } }),
    );
    window.localStorage.setItem("myflove-medications", JSON.stringify(["ritalin"]));
    window.localStorage.setItem("myflove-medications__updated_at", "100");
    window.localStorage.setItem("myflove-medications__synced_at", "100");

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflove-preferred-name")).toBe("Camilla");
    expect(window.localStorage.getItem("myflove-day-window")).not.toBeNull();
    expect(window.localStorage.getItem("myflove-day-edges")).not.toBeNull();
    expect(window.localStorage.getItem("myflove-medications")).toBeNull();
  });

  it("rensar privat data vid utloggning men behåller enhetsinställningar", async () => {
    window.localStorage.setItem("myflove-energy-flow", JSON.stringify([{ mood: 2 }]));
    window.localStorage.setItem("myflove-medications", JSON.stringify(["ritalin"]));
    window.localStorage.setItem("myflove-medications__updated_at", "100");
    window.localStorage.setItem("myflove-medications__synced_at", "100");
    window.localStorage.setItem("myflove-finances", JSON.stringify({ saldo: 100 }));
    window.localStorage.setItem("myflove-theme", "dark");
    window.localStorage.setItem("cookie-consent", "1");
    window.sessionStorage.setItem("myflove-draft", "hemligt");

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflove-energy-flow")).toBeNull();
    expect(window.localStorage.getItem("myflove-medications")).toBeNull();
    expect(window.localStorage.getItem("myflove-finances")).toBeNull();
    expect(window.sessionStorage.getItem("myflove-draft")).toBeNull();

    expect(window.localStorage.getItem("myflove-theme")).toBe("dark");
    expect(window.localStorage.getItem("cookie-consent")).toBe("1");
  });

  it("behåller osynkad data tills molnet bekräftat den", async () => {
    window.localStorage.setItem("myflove-cloud-keys", JSON.stringify(["myflow-dump-ideas"]));
    window.localStorage.setItem("myflow-dump-ideas", JSON.stringify([{ id: "1", text: "idé" }]));
    window.localStorage.setItem("myflow-dump-ideas__updated_at", String(Date.now()));
    // Ingen __synced_at → molnet har aldrig bekräftat posten.

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflow-dump-ideas")).not.toBeNull();
  });

  it("rensar data som molnet bekräftat", async () => {
    const ts = Date.now();
    window.localStorage.setItem("myflove-cloud-keys", JSON.stringify(["myflow-dump-ideas"]));
    window.localStorage.setItem("myflow-dump-ideas", JSON.stringify([{ id: "1", text: "idé" }]));
    window.localStorage.setItem("myflow-dump-ideas__updated_at", String(ts));
    window.localStorage.setItem("myflow-dump-ideas__synced_at", String(ts));

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflow-dump-ideas")).toBeNull();
  });

  it("behåller medicin som inte hunnit bekräftas i molnet", async () => {
    window.localStorage.setItem("myflove-medications", JSON.stringify(["ritalin"]));
    window.localStorage.setItem("myflove-medications__updated_at", String(Date.now()));

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflove-medications")).not.toBeNull();
  });

  it("skyddar osynkad data även när sidans hook aldrig hunnit registrera nyckeln", async () => {
    // Inget register: hooken monterades i en tidigare session.
    window.localStorage.setItem("myflove-cleaning-done", JSON.stringify({ kok: "2026-09-01" }));
    window.localStorage.setItem("myflove-cleaning-done__updated_at", String(Date.now()));

    await clearLocalUserData();

    expect(window.localStorage.getItem("myflove-cleaning-done")).not.toBeNull();
  });


  it("rensar allt vid kontoradering", async () => {
    window.localStorage.setItem("myflove-medications", JSON.stringify(["ritalin"]));
    window.localStorage.setItem("myflove-medications__updated_at", String(Date.now()));

    await clearLocalUserData({ force: true });

    expect(window.localStorage.getItem("myflove-medications")).toBeNull();
  });
});
