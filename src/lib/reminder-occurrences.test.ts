import { describe, expect, it } from "vitest";
import { moveReminderOccurrence, reminderOccurrencesForDay, restoreReminderOccurrence } from "./reminder-occurrences";
import type { Reminder } from "@/hooks/use-data";

const master: Reminder = {
  id: "exercise", title: "Promenad", date: "2026-10-20", time: "09:00",
  endTime: "09:30", repeat: "daily", completed: false, createdAt: 1,
};

describe("One recurring reminder occurrence", () => {
  it("moves only the original event and retains the following day's normal occurrence", () => {
    const original = JSON.stringify(master);
    const overrides = moveReminderOccurrence(master, "2026-10-21", "2026-10-22", "10:15");
    const updated = { ...master, occurrenceOverrides: overrides };
    expect(reminderOccurrencesForDay(updated, "2026-10-21")).toEqual([]);
    expect(reminderOccurrencesForDay(updated, "2026-10-22")).toEqual([
      { occurrenceDate: "2026-10-22", date: "2026-10-22", time: "09:00", endTime: "09:30", moved: false },
      { occurrenceDate: "2026-10-21", date: "2026-10-22", time: "10:15", endTime: "10:45", moved: true },
    ]);
    expect(reminderOccurrencesForDay(updated, "2026-10-23")).toEqual([
      { occurrenceDate: "2026-10-23", date: "2026-10-23", time: "09:00", endTime: "09:30", moved: false },
    ]);
    expect(JSON.stringify(master)).toBe(original);
  });

  it("changes the time on just one day and restores it without overwriting another exception", () => {
    const first = moveReminderOccurrence(master, "2026-10-21", "2026-10-21", "08:15");
    const second = moveReminderOccurrence({ ...master, occurrenceOverrides: first }, "2026-10-22", "2026-10-24", "12:15");
    expect(reminderOccurrencesForDay({ ...master, occurrenceOverrides: second }, "2026-10-21")[0])
      .toMatchObject({ occurrenceDate: "2026-10-21", time: "08:15", endTime: "08:45", moved: true });
    const restored = restoreReminderOccurrence({ ...master, occurrenceOverrides: second }, "2026-10-21");
    expect(restored).toEqual({ "2026-10-22": { date: "2026-10-24", time: "12:15" } });
    expect(restoreReminderOccurrence({ ...master, occurrenceOverrides: first }, "2026-10-21")).toBeUndefined();
    expect(moveReminderOccurrence({ ...master, occurrenceOverrides: first }, "2026-10-21", "2026-10-21", "09:00")).toBeUndefined();
  });

  it("rejects non-series dates, invalid times and invalid calendar days before any write", () => {
    expect(() => moveReminderOccurrence(master, "2026-10-19", "2026-10-22", "12:00")).toThrow();
    expect(() => moveReminderOccurrence(master, "2026-10-21", "2026-02-30", "12:00")).toThrow();
    expect(() => moveReminderOccurrence(master, "2026-10-21", "2026-10-22", "24:00")).toThrow();
    expect(() => moveReminderOccurrence({ ...master, repeat: "none" }, "2026-10-20", "2026-10-22", "10:00")).toThrow();
    expect(() => moveReminderOccurrence({ ...master, endDate: "2026-10-31" }, "2026-10-21", "2026-10-22", "10:00")).toThrow();
  });

  it("keeps recurring weekdays on their source rule and allows moving to weekends", () => {
    const weekday = { ...master, repeat: "weekdays" as const,
      occurrenceOverrides: { "2026-10-23": { date: "2026-10-24", time: "11:00" } } };
    expect(reminderOccurrencesForDay(weekday, "2026-10-23")).toEqual([]);
    expect(reminderOccurrencesForDay(weekday, "2026-10-24")).toEqual([
      { occurrenceDate: "2026-10-23", date: "2026-10-24", time: "11:00", endTime: "11:30", moved: true },
    ]);
    expect(reminderOccurrencesForDay(weekday, "2026-10-26")[0]?.time).toBe("09:00");
  });

  it("does not invent an end time for untimed or malformed old reminders", () => {
    const noDuration = { ...master, endTime: undefined,
      occurrenceOverrides: { "2026-10-21": { date: "2026-10-22", time: "13:00" } } };
    expect(reminderOccurrencesForDay(noDuration, "2026-10-22")[1]?.endTime).toBeUndefined();
    const late = { ...master, occurrenceOverrides: { "2026-10-21": { date: "2026-10-22", time: "23:45" } } };
    expect(reminderOccurrencesForDay(late, "2026-10-22")[1]?.endTime).toBeUndefined();
  });
});
