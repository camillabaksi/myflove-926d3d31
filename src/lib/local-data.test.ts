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

  it("rensar privat data vid utloggning men behåller enhetsinställningar", () => {
    window.localStorage.setItem("myflove-energy-flow", JSON.stringify([{ mood: 2 }]));
    window.localStorage.setItem("myflove-medications", JSON.stringify(["ritalin"]));
    window.localStorage.setItem("myflove-finances", JSON.stringify({ saldo: 100 }));
    window.localStorage.setItem("myflove-theme", "dark");
    window.localStorage.setItem("cookie-consent", "1");
    window.sessionStorage.setItem("myflove-draft", "hemligt");

    clearLocalUserData();

    expect(window.localStorage.getItem("myflove-energy-flow")).toBeNull();
    expect(window.localStorage.getItem("myflove-medications")).toBeNull();
    expect(window.localStorage.getItem("myflove-finances")).toBeNull();
    expect(window.sessionStorage.getItem("myflove-draft")).toBeNull();

    expect(window.localStorage.getItem("myflove-theme")).toBe("dark");
    expect(window.localStorage.getItem("cookie-consent")).toBe("1");
  });
});
