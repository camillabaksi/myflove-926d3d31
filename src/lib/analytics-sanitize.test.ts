import { describe, it, expect } from "vitest";
import {
  sanitizeLabel,
  sanitizeCount,
  sanitizeEventName,
  isSafeLabel,
  MAX_LABEL_LENGTH,
} from "@/lib/analytics-sanitize";
import { sanitizePayload } from "@/lib/analytics-events";

describe("gemensam analytics-sanitizer", () => {
  it("släpper igenom korta tekniska etiketter", () => {
    expect(sanitizeLabel("hem")).toBe("hem");
    expect(sanitizeLabel("ma-bra")).toBe("ma-bra");
    expect(sanitizeLabel("flow-companion")).toBe("flow-companion");
    expect(sanitizeLabel("  slider  ")).toBe("slider");
    expect(isSafeLabel("min-dag")).toBe(true);
  });

  it("stoppar fritext och långa värden", () => {
    expect(sanitizeLabel("jag mår dåligt idag")).toBeNull();
    expect(sanitizeLabel("x".repeat(MAX_LABEL_LENGTH + 1))).toBeNull();
    expect(sanitizeLabel("")).toBeNull();
    expect(sanitizeLabel(42)).toBeNull();
    expect(sanitizeLabel(null)).toBeNull();
  });

  it("stoppar känsliga råvärden", () => {
    expect(sanitizeLabel("a@b.se")).toBeNull();
    expect(sanitizeLabel("https://example.com")).toBeNull();
    expect(sanitizeLabel("0701234567")).toBeNull();
    expect(sanitizeLabel("19900101-1234")).toBeNull();
    expect(sanitizeLabel("4200kr")).toBeNull();
    expect(sanitizeLabel("concerta-dos")).toBeNull();
    expect(sanitizeLabel("mood-8")).toBeNull();
    expect(sanitizeLabel("energi-låg")).toBeNull();
    expect(sanitizeLabel("password")).toBeNull();
  });

  it("begränsar count till ett litet, avrundat antal", () => {
    expect(sanitizeCount(2)).toBe(2);
    expect(sanitizeCount("3")).toBe(3);
    expect(sanitizeCount(2.6)).toBe(3);
    expect(sanitizeCount(-5)).toBe(0);
    expect(sanitizeCount(99999)).toBe(999);
    expect(sanitizeCount("abc")).toBeNull();
  });

  it("validerar event- och sektionsnamn", () => {
    expect(sanitizeEventName("mood_checkin_completed")).toBe("mood_checkin_completed");
    expect(sanitizeEventName("min-dag")).toBe("min-dag");
    expect(sanitizeEventName("MOOD")).toBe("mood");
    expect(sanitizeEventName("a@b.se")).toBeNull();
    expect(sanitizeEventName("fri text")).toBeNull();
    expect(sanitizeEventName("x".repeat(65))).toBeNull();
  });

  it("används av payload-saneringen (en väg ut)", () => {
    const clean = sanitizePayload({
      source: "ma-bra",
      method: "concerta-dos",
      result: "completed",
      count: 1200,
      note: "jag mår dåligt",
      email: "a@b.se",
    } as never);
    expect(clean).toEqual({ source: "ma-bra", result: "completed", count: 999 });
    expect(JSON.stringify(clean)).not.toMatch(/concerta|dåligt|a@b\.se/);
  });
});
