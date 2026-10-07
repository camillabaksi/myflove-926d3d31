import { describe, expect, it } from "vitest";
import { deriveDayPace, knownTimeSpace, pacePlanningEntries } from "./day-pace";
import type { CalendarEntry } from "./visual-calendar";

const item = (patch: Partial<CalendarEntry> = {}): CalendarEntry => ({ id: "a", sourceId: "a", source: "task", date: "2026-10-07", title: "Sak", done: false, editable: true, energyImpact: "drains", friction: "medium", ...patch });

describe("day pace", () => {
  it("does not calculate personal pace without capacity or for future days", () => {
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: null, entries: [item()] }).level).toBeNull();
    expect(deriveDayPace({ date: "2026-10-08", today: "2026-10-07", capacity: 80, entries: [item()] }).reason).toBe("future");
  });
  it("does not calculate pace when all planned energy impact is unknown", () => {
    const pace = deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 80, entries: [item({ energyImpact: "unknown" })] });
    expect(pace.level).toBeNull(); expect(pace.reason).toBe("unknown-load");
  });
  it("uses gentle for demanding load, limited capacity with load and verified tight chains", () => {
    const heavy = [0, 1, 2].map(n => item({ id: String(n), sourceId: String(n), friction: "large" }));
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 90, entries: heavy }).level).toBe("gentle");
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 20, entries: [item({ friction: "small" })] }).reason).toBe("limited-capacity");
    const tight = [item({ id: "1", time: "14:00", endTime: "15:00" }), item({ id: "2", time: "15:00", endTime: "16:00" }), item({ id: "3", time: "16:10", endTime: "17:00", energyImpact: "gives" })];
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 70, entries: tight }).reason).toBe("tight");
  });
  it("requires known capacity, known light load and verified room for open", () => {
    const spaced = [item({ id: "1", time: "09:00", endTime: "09:30", friction: "small" }), item({ id: "2", time: "10:00", endTime: "10:30", energyImpact: "gives" })];
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 80, entries: spaced }).level).toBe("open");
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 20, entries: [] }).level).not.toBe("open");
    expect(deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 80, entries: [item({ energyImpact: "unknown" })] }).level).not.toBe("open");
  });
  it("never invents time around unknown durations and detects overlaps", () => {
    expect(knownTimeSpace([item({ time: "09:00" }), item({ id: "2", time: "10:00", endTime: "10:30" })]).gaps).toHaveLength(0);
    expect(knownTimeSpace([item({ time: "09:00", endTime: "10:30" }), item({ id: "2", time: "10:00", endTime: "11:00" })]).overlaps).toBe(1);
  });
  it("counts only explicit family presence and deduplicates its parent task", () => {
    const parent = item({ sourceId: "parent" });
    const context = item({ id: "child-1", source: "child", sourceId: "child-1", editable: false });
    const linked = item({ id: "child-2", source: "child", sourceId: "child-2", editable: false, requiresParent: true, parentTaskId: "parent" });
    const presence = item({ id: "child-3", source: "child", sourceId: "child-3", editable: false, requiresParent: true });
    expect(pacePlanningEntries([parent, context, linked, presence]).map(entry => entry.id)).toEqual(["a", "child-3"]);
  });
  it("treats recovery as legitimate time without adding capacity", () => {
    const recovery = item({ energyImpact: "gives", time: "12:00", endTime: "12:30" });
    const pace = deriveDayPace({ date: "2026-10-07", today: "2026-10-07", capacity: 65, entries: [recovery] });
    expect(pace.load.segments).toBe(1); expect(pace.level).toBe("steady");
  });
});