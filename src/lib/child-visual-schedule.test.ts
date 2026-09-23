import { describe, expect, it } from "vitest";

import {
  activityDedupKey,
  dayPart,
  decodeVisualNotes,
  encodeVisualNotes,
  getScheduleGuidance,
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
    const notes = encodeVisualNotes({ emoji: "🎒", category: "hemma", tone: "mint" }, "Vid dörren");
    expect(decodeVisualNotes(notes)).toEqual({
      meta: { emoji: "🎒", category: "hemma", tone: "mint" },
      note: "Vid dörren",
    });
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