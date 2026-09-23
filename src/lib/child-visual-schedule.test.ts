import { describe, expect, it } from "vitest";

import {
  activityDedupKey,
  dayPart,
  decodeVisualNotes,
  encodeVisualNotes,
  getScheduleGuidance,
  pictogramForActivity,
  copiedVisualNotes,
  searchActivityBank,
  shiftDateBetween,
  startOfWeekISO,
  transitionPrompt,
  weekDates,
} from "@/lib/child-visual-schedule";

describe("child visual schedule", () => {
  it("builds a monday to sunday week", () => {
    expect(startOfWeekISO("2026-09-23")).toBe("2026-09-21");
    expect(weekDates("2026-09-23")).toEqual([
      "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27",
    ]);
  });

  it("round-trips visual metadata without losing a note", () => {
    const notes = encodeVisualNotes({ pictogram: "bag", category: "hemma", tone: "mint" }, "Vid dörren");
    expect(decodeVisualNotes(notes)).toEqual({
      meta: { pictogram: "bag", category: "hemma", tone: "mint" },
      note: "Vid dörren",
    });
  });

  it("maps old emoji metadata to a current pictogram", () => {
    const legacy = '[myflove-visual:{"emoji":"🚌","category":"transport","tone":"sun"}]\nHållplatsen';
    expect(decodeVisualNotes(legacy)).toEqual({ meta: { pictogram: "bus", category: "transport", tone: "sun" }, note: "Hållplatsen" });
  });

  it("searches pictograms by title and keyword", () => {
    expect(searchActivityBank("sim").map((item) => item.title)).toContain("Simning");
    expect(searchActivityBank("bok").map((item) => item.title)).toContain("Läxa");
    expect(pictogramForActivity("Buss", "home")).toBe("bus");
  });

  it("shifts dates and strips private notes for cross-child copies", () => {
    expect(shiftDateBetween("2026-09-23", "2026-09-21", "2026-09-28")).toBe("2026-09-30");
    const notes = encodeVisualNotes({ pictogram: "headphones", category: "återhämtning", tone: "sky" }, "Behöver hörselkåpor");
    expect(decodeVisualNotes(copiedVisualNotes(notes, false)).note).toBe("");
    expect(decodeVisualNotes(copiedVisualNotes(notes, true)).note).toBe("Behöver hörselkåpor");
  });

  it("normalizes duplicate activities", () => {
    expect(activityDedupKey({ childId: "a", title: "  Packa  väskan ", date: "2026-09-23", time: "08:00:00" }))
      .toBe(activityDedupKey({ childId: "a", title: "packa väskan", date: "2026-09-23", time: "08:00" }));
  });

  it("groups the day and softens a full schedule by capacity", () => {
    expect(dayPart("07:30")).toBe("Morgon");
    expect(dayPart("16:00")).toBe("Efter skolan");
    expect(getScheduleGuidance(4, "låg").message).not.toBeNull();
    expect(getScheduleGuidance(4, "hög").message).toBeNull();
    expect(getScheduleGuidance(3, "medel").recovery).not.toBeNull();
  });

  it("creates a transition prompt from the next activity", () => {
    expect(transitionPrompt("Gå till bussen")).toBe("Om 10 minuter är det dags för gå till bussen.");
  });
});