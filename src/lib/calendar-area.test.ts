import { describe, expect, it } from "vitest";
import { calendarArea, calendarMonthAreas, calendarMonthCapacity } from "./calendar-area";
import type { CalendarEntry } from "./visual-calendar";

const entry: CalendarEntry = { id: "a", sourceId: "a", source: "task", date: "2026-10-07", title: "Test", done: false, editable: true };
describe("calendar area presentation", () => {
  it("summarizes areas rather than activities and collapses family context", () => {
    expect(calendarMonthAreas([{ ...entry, source: "child" }, { ...entry, source: "child" }, { ...entry, source: "family" }, { ...entry, area: "studier" }, { ...entry, area: "studier" }])).toEqual(["privat", "studier"]);
    expect(calendarMonthAreas([])).toEqual([]);
  });
  it("never displays future capacity, even if a value was supplied", () => {
    expect(calendarMonthCapacity("2026-10-08", "2026-10-07", 50)).toBeNull();
    expect(calendarMonthCapacity("2026-10-07", "2026-10-07", 50)).toBe(50);
    expect(calendarMonthCapacity("2026-10-06", "2026-10-07", null)).toBeNull();
  });
  it("keeps explicit areas even when an activity gives energy", () => {
    expect(calendarArea({ ...entry, area: "jobb", energyImpact: "gives" })).toBe("jobb");
    expect(calendarArea({ ...entry, area: "halsa" })).toBe("halsa");
  });
  it("uses only known sources and preserves legacy family areas", () => {
    expect(calendarArea({ ...entry, source: "child" })).toBe("barn");
    expect(calendarArea({ ...entry, source: "study" })).toBe("studier");
    expect(calendarArea({ ...entry, area: "relationer" })).toBe("privat");
    expect(calendarArea({ ...entry, source: "external" })).toBe("external");
    expect(calendarArea({ ...entry, title: "Medicin" })).toBe("vardag");
  });
});