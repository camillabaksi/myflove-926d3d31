import { describe, expect, it } from "vitest";
import { calendarGeometry, calendarOffset, calendarBlockHeight, calendarDropMinute, calendarTimelineHeight } from "./calendar-geometry";
import { layoutCalendar, calendarGaps, type CalendarEntry } from "./visual-calendar";

describe("compact mobile calendar geometry", () => {
  it("compresses mobile hours by about 20 percent, keeping desktop unchanged", () => {
    expect(calendarOffset(600, 540, calendarGeometry(false).scale)).toBe(81);
    expect(calendarOffset(600, 540, calendarGeometry(true).scale)).toBe(102);
    expect(calendarGeometry(true).visualMinutes).toBe(32);
  });
  it.each([false, true])("round trips displayed drag coordinates and clamps to the displayed day (%s)", desktop => {
    const { scale } = calendarGeometry(desktop);
    expect(calendarDropMinute(calendarOffset(615, 480, scale), 480, 1440, scale)).toBe(615);
    expect(calendarDropMinute(-500, 480, 1440, scale)).toBe(480);
    expect(calendarDropMinute(9999, 0, 1440, scale)).toBe(1425);
  });
  it("retains readable minimum targets for short events without changing their times", () => {
    const geometry = calendarGeometry(false);
    const items: CalendarEntry[] = [540, 570].map((minute, i) => ({ id: String(i), sourceId: String(i), source: "task", date: "2026-10-20", title: "Kort aktivitet", time: minute === 540 ? "09:00" : "09:30", done: false, editable: true }));
    const original = JSON.stringify(items);
    const blocks = layoutCalendar(items, geometry.visualMinutes);
    expect(blocks.map(block => block.lanes)).toEqual([2, 2]);
    expect(calendarBlockHeight(540, 541, geometry.scale, geometry.entryMinimum)).toBeGreaterThanOrEqual(44);
    expect(calendarGaps(items)).toEqual([]);
    expect(JSON.stringify(items)).toBe(original);
  });
  it("leaves room after midnight for a late family target", () => {
    const g = calendarGeometry(false);
    expect(calendarOffset(1439, 1320, g.scale) + g.familyMinimum).toBeLessThanOrEqual(calendarTimelineHeight(1320, 1440, g.scale, g.endPadding));
  });
  it("enlarges content occupancy, not the time scale, for 200 percent text", () => {
    const normal = calendarGeometry(false), enlarged = calendarGeometry(false, 2);
    expect(enlarged.scale).toBe(normal.scale);
    expect(enlarged.entryMinimum).toBe(128);
    expect(enlarged.familyMinimum).toBe(144);
    expect(enlarged.visualMinutes).toBeGreaterThan(normal.visualMinutes);
    expect(calendarGeometry(true, 2)).toEqual(calendarGeometry(true));
  });
});