import { describe, expect, it } from "vitest";
import { calendarClusters, calendarGaps, calendarLoad, calendarTimelineRange, layoutCalendar, minuteOf, periodDates, projectCalendar, type CalendarEntry, type CalendarSources } from "./visual-calendar";

const entry = (id: string, time: string, endTime?: string): CalendarEntry => ({ id, sourceId: id, source: "task", date: "2026-10-07", title: id, time, endTime, done: false, editable: true });
const empty: CalendarSources = { tasks: [], reminders: [], lectures: [], routines: [], quickflow: [], priority: [] };
describe("visual calendar", () => {
  it("uses Monday-first month and week periods", () => {
    expect(periodDates("2026-10-07", "vecka")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
    const month = periodDates("2026-10-07", "manad");
    expect(month[0]).toBe("2026-09-28");
    expect(month.at(-1)).toBe("2026-11-01");
    expect(month).toHaveLength(35);
    expect(periodDates("2026-10-07", "dag")).toEqual(["2026-10-07"]);
  });
  it("rejects invalid times", () => {
    expect(minuteOf("24:00")).toBeNull();
    expect(minuteOf("12:60")).toBeNull();
    expect(minuteOf("9:00")).toBeNull();
    expect(minuteOf("09:30")).toBe(570);
  });
  it("shows only gaps backed by known finish times", () => {
    expect(calendarGaps([entry("a", "09:00", "09:30"), entry("b", "10:15", "11:00")])).toEqual([{ start: 570, end: 615, minutes: 45 }]);
    expect(calendarGaps([entry("a", "09:00"), entry("b", "09:15", "09:30"), entry("c", "10:30")])).toEqual([]);
    expect(calendarGaps([entry("a", "09:00", "11:00"), entry("b", "09:15", "10:00"), entry("c", "11:45")])).toEqual([{ start: 660, end: 705, minutes: 45 }]);
  });
  it("does not invent energy for unknown activities", () => {
    expect(calendarLoad([entry("a", "09:00")])).toEqual({ label: "Inte uppskattad", segments: 0, unknown: 1 });
    expect(calendarLoad([]).segments).toBe(0);
    expect(calendarLoad([{ ...entry("a", "09:00"), energyImpact: "gives" }]).label).toBe("Låg");
  });
  it("keeps a multi-day period's original start across day, week and month projections", () => {
    const reminder = { id: "course", title: "Pågående kurs", date: "2026-10-05", endDate: "2026-10-30", completed: false, createdAt: 0, repeat: "none" as const };
    const days = projectCalendar(["2026-10-05", "2026-10-12", "2026-10-23"], { ...empty, reminders: [reminder] }, "2026-10-23");
    for (const date of ["2026-10-05", "2026-10-12", "2026-10-23"]) {
      expect(days[date]).toEqual([expect.objectContaining({
        id: "rem-course", date, periodStart: "2026-10-05", periodEnd: "2026-10-30",
        time: undefined, done: false,
      })]);
    }
    expect(days["2026-10-23"]?.[0]?.date).toBe("2026-10-23");
    expect(reminder.date).toBe("2026-10-05");
  });
  it("shows a rescheduled reminder once on the new day alongside that day's own occurrence", () => {
    const reminder = { id: "walk", title: "Promenad", date: "2026-10-20",
      time: "09:00", endTime: "09:30", repeat: "daily" as const, completed: false, createdAt: 0,
      occurrenceOverrides: { "2026-10-21": { date: "2026-10-22", time: "10:00" } } };
    const original = JSON.stringify(reminder);
    const days = projectCalendar(["2026-10-21", "2026-10-22", "2026-10-23"], { ...empty, reminders: [reminder] }, "2026-10-22");
    expect(days["2026-10-21"]).toEqual([]);
    expect(days["2026-10-22"]?.map(entry => [entry.id, entry.occurrenceDate, entry.time, entry.endTime])).toEqual([
      ["rem-walk", "2026-10-22", "09:00", "09:30"],
      ["rem-walk:2026-10-21", "2026-10-21", "10:00", "10:30"],
    ]);
    expect(days["2026-10-23"]?.map(e => e.time)).toEqual(["09:00"]);
    expect(JSON.stringify(reminder)).toBe(original);
  });
  it("preserves original records while projecting routines", () => {
    const data = { ...empty, routines: [{ id: "r", title: "Medicin", enabled: true, time: "09:00", createdAt: 0, repeat: "daily" as const }] };
    const original = JSON.stringify(data);
    const days = projectCalendar(["2026-10-07", "2026-10-08"], data, "2026-10-07");
    expect(days["2026-10-07"]?.[0]?.sourceId).toBe("r");
    expect(days["2026-10-08"]?.[0]?.editable).toBe(false);
    expect(JSON.stringify(data)).toBe(original);
  });
  it("separates overlapping blocks and gives short events stable touch geometry", () => {
    const blocks = layoutCalendar([entry("a", "09:00", "10:00"), entry("b", "09:15", "09:30"), entry("c", "10:00", "10:30")]);
    expect(blocks[0]?.lanes).toBe(2);
    expect(blocks[1]?.lane).toBe(1);
    expect(blocks[2]?.lanes).toBe(1);
    expect(layoutCalendar([entry("a", "09:00")])[0]?.end).toBe(572);
  });
  it("keeps every transitive overlap accessible in a group", () => {
    const groups = calendarClusters(layoutCalendar([entry("a", "09:00", "09:45"), entry("b", "09:30", "10:30"), entry("c", "10:00", "11:00")]));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.blocks).toHaveLength(3);
    expect(groups[0]?.end).toBe(660);
  });
  it("leaves empty days compact and can explicitly show every hour", () => {
    expect(calendarTimelineRange([])).toBeNull();
    expect(calendarTimelineRange([], true)).toEqual({ first: 0, last: 1440 });
    expect(calendarTimelineRange(layoutCalendar([entry("a", "09:00", "09:30")]))).toEqual({ first: 480, last: 660 });
  });
  it("keeps early and late activities in range without inferring their duration or free time", () => {
    const early = entry("early", "00:05"), late = entry("late", "23:59");
    const original = JSON.stringify([early, late]);
    expect(calendarTimelineRange(layoutCalendar([early]))).toEqual({ first: 0, last: 120 });
    expect(calendarTimelineRange(layoutCalendar([late]))).toEqual({ first: 1320, last: 1440 });
    expect(calendarTimelineRange(layoutCalendar([early, late]))).toEqual({ first: 0, last: 1440 });
    expect(calendarGaps([early, late])).toEqual([]);
    expect(JSON.stringify([early, late])).toBe(original);
  });
  it("keeps overdue tasks unscheduled today and generated study tasks read-only", () => {
    const tasks = [{ id: "overdue", title: "Ärende", completed: false, createdAt: 0, dueDate: "2026-10-06", time: "09:00" }, { id: "study", title: "Lektion", completed: false, createdAt: 0, dueDate: "2026-10-07", syncKey: "studyflow:lecture:x:2026-10-07" }];
    const days = projectCalendar(["2026-10-06", "2026-10-07", "2026-10-08"], { ...empty, tasks }, "2026-10-07");
    expect(days["2026-10-06"]?.[0]?.time).toBe("09:00");
    expect(days["2026-10-07"]?.[0]?.time).toBeUndefined();
    expect(days["2026-10-07"]?.[1]?.editable).toBe(false);
    expect(days["2026-10-08"]).toEqual([]);
  });
});
