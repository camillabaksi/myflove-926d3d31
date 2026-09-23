import { describe, expect, it } from "vitest";

import {
  activityDedupKey,
  activityOccursOn,
  buildMultiMovePatches,
  CATEGORY_STYLES,
  dayPart,
  decodeVisualNotes,
  encodeVisualNotes,
  getScheduleGuidance,
  pictogramForActivity,
  copiedVisualNotes,
  searchActivityBank,
  shiftDateBetween,
  shiftEndTime,
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
    const notes = encodeVisualNotes({ pictogram: "bag", category: "hemma", tone: "mint", endTime: "08:30" }, "Vid dörren");
    expect(decodeVisualNotes(notes)).toEqual({
      meta: { pictogram: "bag", category: "hemma", tone: "mint", endTime: "08:30" },
      note: "Vid dörren",
    });
  });

  it("stores Barn as a label inside Familj, not as a new area", () => {
    const notes = encodeVisualNotes({ pictogram: "childcare", category: "familj", tone: "mint", familyLabel: "child" }, "Bella");
    expect(decodeVisualNotes(notes)).toEqual({
      meta: { pictogram: "childcare", category: "familj", tone: "mint", familyLabel: "child" },
      note: "Bella",
    });
    expect(searchActivityBank("hämta barn", "familj").map((item) => item.title)).toContain("Hämta/lämna barn");
    expect(searchActivityBank("barnläkare", "familj").map((item) => item.title)).toContain("Barnläkare/vårdbesök");
    expect(Object.keys(CATEGORY_STYLES)).not.toContain("barn");
  });

  it("maps old emoji metadata to a current pictogram", () => {
    const legacy = '[myflove-visual:{"emoji":"🚌","category":"transport","tone":"sun"}]\nHållplatsen';
    expect(decodeVisualNotes(legacy)).toEqual({ meta: { pictogram: "bus", category: "transport", tone: "sun" }, note: "Hållplatsen" });
  });

  it("searches pictograms by title and keyword", () => {
    expect(searchActivityBank("sim").map((item) => item.title)).toContain("Simning");
    expect(searchActivityBank("bok").map((item) => item.title)).toContain("Läxa");
    expect(pictogramForActivity("Buss", "home")).toBe("bus");
    expect(searchActivityBank("läkare").map((item) => item.title)).toContain("Doktor");
    expect(searchActivityBank("BUP").map((item) => item.title)).toContain("Samtal");
    expect(searchActivityBank("mataffär").map((item) => item.title)).toContain("Handla");
    expect(pictogramForActivity("Besök hos tandläkare", "home")).toBe("dentist");
  });

  it("keeps neutral healthcare metadata in the existing schedule format", () => {
    const notes = encodeVisualNotes({ pictogram: "clinic", category: "vård", tone: "sky" });
    expect(decodeVisualNotes(notes)).toEqual({
      meta: { pictogram: "clinic", category: "vård", tone: "sky" },
      note: "",
    });
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

  it("uses the existing repeat value to show recurring activities", () => {
    expect(activityOccursOn({ date: "2026-09-21", repeat: "daily" }, "2026-09-23")).toBe(true);
    expect(activityOccursOn({ date: "2026-09-21", repeat: "weekdays" }, "2026-09-26")).toBe(false);
    expect(activityOccursOn({ date: "2026-09-21", repeat: "weekly" }, "2026-09-28")).toBe(true);
    expect(activityOccursOn({ date: "2026-09-21", repeat: "none" }, "2026-09-22")).toBe(false);
  });

  it("moves several existing ids while preserving their time spacing", () => {
    expect(buildMultiMovePatches([
      { id: "dentist", date: "2026-09-23", time: "14:00" },
      { id: "bus", date: "2026-09-23", time: "15:30" },
    ], "2026-09-24", "15:00")).toEqual([
      { id: "dentist", date: "2026-09-24", time: "15:00" },
      { id: "bus", date: "2026-09-24", time: "16:30" },
    ]);
  });

  it("keeps the activity duration when its start time moves", () => {
    expect(shiftEndTime("14:00", "14:45", "15:00")).toBe("15:45");
    expect(shiftEndTime("14:00", undefined, "15:00")).toBeUndefined();
  });

  it("defines a distinct semantic area treatment for every category", () => {
    expect(Object.keys(CATEGORY_STYLES)).toEqual(expect.arrayContaining(["hemma", "skola", "mat", "hygien", "träning", "vård", "familj", "återhämtning", "fritid"]));
    expect(CATEGORY_STYLES.vård.card).not.toBe(CATEGORY_STYLES.skola.card);
  });
});