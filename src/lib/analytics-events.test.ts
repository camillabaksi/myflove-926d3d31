import { describe, it, expect } from "vitest";
import { ANALYTICS_EVENTS, sanitizePayload, type AnalyticsEventName } from "@/lib/analytics-events";

describe("analytics-schemat", () => {
  it("innehåller de flöden vi mäter", () => {
    const required: AnalyticsEventName[] = [
      "home_viewed",
      "battery_opened",
      "battery_checkin_started",
      "battery_checkin_completed",
      "mood_checkin_completed",
      "onboarding_skipped",
      "install_prompt_shown",
      "install_started",
      "install_completed",
      "logout",
      "account_deletion_started",
      "account_deleted",
    ];
    for (const name of required) expect(ANALYTICS_EVENTS).toContain(name);
  });

  it("släpper aldrig igenom känsliga värden", () => {
    const cleaned = sanitizePayload({
      source: "hem",
      mood: 8,
      note: "jag mår dåligt idag",
      amount: 1200,
      medication: "concerta",
    } as never);
    expect(cleaned).toEqual({ source: "hem" });
  });

  it("behåller bara tillåtna nycklar", () => {
    const cleaned = sanitizePayload({
      source: "ma-bra",
      method: "slider",
      result: "completed",
      count: 2,
    });
    expect(Object.keys(cleaned ?? {}).sort()).toEqual(["count", "method", "result", "source"]);
  });
});
