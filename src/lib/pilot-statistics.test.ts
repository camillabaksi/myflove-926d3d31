import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { pilotDate, summarizePilotAccounts, summarizePilotUsage, type PilotEvent } from "./pilot-statistics";

const now = Date.parse("2026-10-15T12:00:00Z");
const event = (session_id: string, action: string, created_at = "2026-10-14T10:00:00Z"): PilotEvent => ({ session_id, action, created_at });
const account = (id: string, lastActiveAt: string | null, metadata = {}, created_at = "2026-01-01T00:00:00Z") => ({
  user: { id, email: `${id}@example.test`, user_metadata: metadata, created_at } as User, lastActiveAt,
});

describe("Pilot account scope", () => {
  it("counts each active external account once, excludes admin/demo, keeps missing history unknown", () => {
    const recent = "2026-10-14T10:00:00Z";
    const data = summarizePilotAccounts([
      account("ios", recent, { registration_platform: "ios" }, recent),
      account("ios", recent, { registration_platform: "ios" }, recent),
      account("unknown", "2026-09-20T00:00:00Z"), account("old", "2026-08-01T00:00:00Z"),
      account("never", null, {}, recent), account("admin", recent),
      account("demo", recent, { demo_account: "true" }),
    ], new Set(["admin"]), now);
    expect(data.active30d).toBe(2);
    expect(data.active7d).toBe(1);
    expect(data.newActive7d).toBe(1);
    expect(data.platforms).toEqual({ all: 2, ios: 1, android: 0, web: 0, unknown: 1 });
    expect(data.history).toEqual({ registered: 4, inactive: 2, internal: 2 });
  });
});

describe("Pilot usage measurements", () => {
  it("uses exact distinct unions of actions, never sums actions or treats views as use", () => {
    const data = summarizePilotUsage([
      event("a", "task_created"), event("a", "note_created"), event("a", "task_created"),
      event("b", "note_created"), event("b", "task_completed"),
      event("viewer", "today_viewed"), event("viewer", "recovery_micro_opened"),
      event("internal", "task_created"), event("old", "task_created", "2026-08-01T00:00:00Z"),
      event("future", "task_created", "2027-01-01T00:00:00Z"), event("invalid", "task_created", "bad-date"),
    ], [{ session_id: "internal", is_internal: true }, { session_id: "a", is_internal: false }], now);
    expect(data.browsers).toBe(3);
    expect(data.meaningfulBrowsers).toBe(2);
    expect(data.features.find(row => row.id === "plan")?.browsers).toBe(2);
    expect(data.features.find(row => row.id === "do")?.browsers).toBe(1);
    expect(data.features.find(row => row.id === "recover")?.browsers).toBe(0);
    expect(data.internalBrowsersExcluded).toBe(1);
    expect(data.unknownBrowsers).toBe(2);
  });
  it("requires core actions on different Swedish dates, with the denominator visible", () => {
    const data = summarizePilotUsage([
      event("repeat", "task_created", "2026-10-13T21:59:00Z"), // 23:59 Swedish time
      event("repeat", "recovery_pause_started", "2026-10-13T22:01:00Z"), // next local date
      event("same-day", "task_created"), event("same-day", "task_completed"),
      event("same-day", "today_viewed", "2026-10-12T12:00:00Z"),
    ], [], now);
    expect(data.meaningfulBrowsers).toBe(2);
    expect(data.repeatedBrowsers).toBe(1);
    expect(data.repeatRate).toBe(50);
    expect(data.daily.find(row => row.date === "2026-10-14")?.browsers).toBe(2);
    expect(data.daily).toHaveLength(14);
    expect(data.daily.at(-1)?.browsers).toBe(0);
    expect(pilotDate("2026-10-25T00:30:00Z")).toBe("2026-10-25");
    expect(pilotDate("2026-10-25T01:30:00Z")).toBe("2026-10-25"); // repeated DST hour
  });
  it("matches start before completion within 30 minutes and counts browsers rather than attempts", () => {
    const data = summarizePilotUsage([
      event("ok", "battery_checkin_completed", "2026-10-14T10:10:00Z"),
      event("ok", "battery_checkin_started"), event("ok", "battery_checkin_started", "2026-10-14T10:01:00Z"),
      event("reverse", "battery_checkin_completed"), event("reverse", "battery_checkin_started", "2026-10-14T10:01:00Z"),
      event("late", "battery_checkin_started"), event("late", "battery_checkin_completed", "2026-10-14T10:31:00Z"),
      event("no-start", "battery_checkin_completed"),
    ], [], now);
    expect(data.energyCheckin).toEqual({ started: 3, completedAfterStart: 1, completionRate: 33 });
    expect(data.features.find(row => row.id === "energy")?.browsers).toBe(4);
  });
  it("keeps an empty denominator unknown instead of presenting 0% success or retention", () => {
    const data = summarizePilotUsage([], [], now);
    expect(data.repeatRate).toBeNull();
    expect(data.energyCheckin.completionRate).toBeNull();
    expect(data.daily.every(row => row.browsers === 0)).toBe(true);
  });
  it("never treats the shared missing-storage sentinel as a unique browser", () => {
    const data = summarizePilotUsage([event("unknown", "task_created"), event("unknown", "task_completed"), event("server", "task_created")], [], now);
    expect(data.browsers).toBe(0);
    expect(data.meaningfulBrowsers).toBe(0);
    expect(data.unidentifiedEvents).toBe(3);
  });
});
