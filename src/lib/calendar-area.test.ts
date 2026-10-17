import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AREA_META, ALL_AREAS, areaColor, areaTint } from "./life-areas";
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
describe("consistent area colors across calendar and app", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

  it("uses the same base HSL token for every life area", () => {
    for (const area of ALL_AREAS) {
      const cssToken = new RegExp(`--calendar-${area}:\\s*([0-9]+\\s+[0-9]+%\\s+[0-9]+%);`);
      const match = css.match(cssToken);
      expect(match?.[1], `CSS color for ${area}`).toBe(AREA_META[area].hue);
      expect(css).toContain(`[data-calendar-area="${area}"] { --calendar-area: var(--calendar-${area}); }`);
      expect(areaColor(area)).toContain(`--calendar-${area}`);
      expect(areaTint(area)).toContain(`--calendar-${area}`);
    }
  });

  it("keeps study teal, own time purple and home green", () => {
    expect(AREA_META.studier.hue).toMatch(/^18[0-9] /);
    expect(AREA_META.egentid.hue).toMatch(/^28[0-9] /);
    expect(AREA_META.vardag.hue).toMatch(/^150 /);
  });

  it("uses the same area classification for month dots and activity cards", () => {
    for (const area of ALL_AREAS) {
      const activity = { ...entry, area };
      expect(calendarMonthAreas([activity])).toEqual([calendarArea(activity)]);
    }
  });
});
