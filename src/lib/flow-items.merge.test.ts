import { describe, expect, it } from "vitest";
import { mergeRoutineCalendarDuplicates, type FlowItem } from "./flow-items";

function row(id: string, source: FlowItem["source"], done = false, title = "Handla", time = "14:00"): FlowItem {
  return { id, source, title, time, done, area: "vardag", emoji: "", priority: "idag", completable: true };
}

describe("read-only aggregation of the same day in Idag and Kalender", () => {
  it("keeps two independently saved tasks with the same text and time", () => {
    const tasks = [row("task-a", "uppgift"), row("task-b", "uppgift")];
    expect(mergeRoutineCalendarDuplicates(tasks)).toEqual(tasks);
  });

  it("keeps tasks even when a reminder or routine happens to share their title and time", () => {
    const items = [
      row("task-a", "uppgift"),
      row("rem-a", "kalender"),
      row("task-b", "uppgift"),
      row("routine-a", "rutin"),
      row("child-a", "barn"),
      row("qf-a", "tanke"),
    ];
    expect(mergeRoutineCalendarDuplicates(items).map(item => item.id))
      .toEqual(["task-a", "rem-a", "task-b", "child-a", "qf-a"]);
  });

  it("merges only one true routine/calendar duplicate, retaining the calendar completion surface", () => {
    const items = [row("routine-a", "rutin"), row("rem-a", "kalender")];
    expect(mergeRoutineCalendarDuplicates(items)).toEqual([items[1]]);
    const reversed = [...items].reverse();
    expect(mergeRoutineCalendarDuplicates(reversed)).toEqual([items[1]]);
  });

  it("keeps the done routine when the matching calendar row is still open", () => {
    const items = [row("routine-a", "rutin", true), row("rem-a", "kalender", false)];
    expect(mergeRoutineCalendarDuplicates(items)).toEqual([items[0]]);
  });

  it("pairs rows one-to-one: a second reminder or routine is always independently visible", () => {
    const rows = [
      row("rem-first", "kalender"),
      row("rem-second", "kalender"),
      row("routine-first", "rutin"),
      row("routine-second", "rutin"),
      row("routine-third", "rutin"),
    ];
    expect(mergeRoutineCalendarDuplicates(rows).map(item => item.id))
      .toEqual(["rem-first", "rem-second", "routine-third"]);
    expect(mergeRoutineCalendarDuplicates(rows.slice(0, 3)).map(item => item.id))
      .toEqual(["rem-first", "rem-second"]);
  });

  it("keeps independent matching titles in each source, including two moved recurring occurrences", () => {
    const items = [
      row("rem-repeat", "kalender"),
      row("rem-repeat:2026-10-22", "kalender"),
      row("routine-other", "rutin", false, "Annat"),
      row("routine-another", "rutin", false, "Annat"),
    ];
    expect(mergeRoutineCalendarDuplicates(items)).toEqual(items);
  });

  it("matches capitalization and whitespace for the narrow routine/calendar projection", () => {
    const items = [row("routine-a", "rutin", false, "  Göra   frukost"), row("rem-a", "kalender", false, "göra frukost")];
    expect(mergeRoutineCalendarDuplicates(items)).toEqual([items[1]]);
  });

  it("never mutates source data or changes the source IDs during a read-only projection", () => {
    const items = [row("task-a", "uppgift"), row("routine-a", "rutin"), row("rem-a", "kalender")];
    const snapshot = JSON.stringify(items);
    mergeRoutineCalendarDuplicates(items);
    expect(JSON.stringify(items)).toBe(snapshot);
  });
});
