import { describe, expect, it } from "vitest";
import type { Reminder } from "@/hooks/use-data";
import { groupReminders, reminderStatus } from "./reminder-status";

const now = new Date(2026, 9, 12, 10, 30);
const reminder = (patch: Partial<Reminder> = {}): Reminder => ({
  id: "rem-1",
  title: "En påminnelse",
  date: "2026-10-12",
  time: "11:00",
  completed: false,
  createdAt: 1,
  ...patch,
});

describe("reminder display status", () => {
  it("moves a one-off into history when its local time is reached", () => {
    expect(reminderStatus(reminder(), now)).toBe("active");
    expect(reminderStatus(reminder({ time: "10:30" }), now)).toBe("passed");
    expect(reminderStatus(reminder({ date: "2026-10-11" }), now)).toBe("passed");
  });
  it("uses the scheduled time, not the lead notification, for display status", () => {
    expect(reminderStatus(reminder({ remindMinutesBefore: 60 }), now)).toBe("active");
  });
  it("keeps untimed entries through their last local day", () => {
    expect(reminderStatus(reminder({ time: undefined }), now)).toBe("active");
    expect(reminderStatus(reminder({ time: undefined }), new Date(2026, 9, 13))).toBe("passed");
  });
  it("does not expire recurring rules with an old start date or daily completion", () => {
    for (const repeat of ["daily", "weekly", "weekdays"] as const) {
      expect(reminderStatus(reminder({ date: "2025-01-01", repeat }), now)).toBe("active");
      expect(reminderStatus(reminder({ date: "2025-01-01", repeat, completed: true }), now)).toBe(
        "active",
      );
    }
  });
  it("honors cancellation and manually completed one-offs", () => {
    expect(reminderStatus(reminder({ completed: true }), now)).toBe("completed");
    expect(reminderStatus(reminder({ completed: true, canceled: true }), now)).toBe("canceled");
  });
  it("keeps an ongoing period and an ongoing timed activity out of history", () => {
    expect(reminderStatus(reminder({ date: "2026-10-10", endDate: "2026-10-13" }), now)).toBe(
      "active",
    );
    expect(reminderStatus(reminder({ date: "2026-10-10", endDate: "2026-10-11" }), now)).toBe(
      "passed",
    );
    expect(reminderStatus(reminder({ time: "09:00", endTime: "12:00" }), now)).toBe("active");
    expect(reminderStatus(reminder({ time: "09:00", endTime: "10:30" }), now)).toBe("passed");
  });
  it("does not invent an expiration for malformed legacy dates or times", () => {
    expect(reminderStatus(reminder({ date: "2026-02-31" }), now)).toBe("active");
    expect(reminderStatus(reminder({ time: "25:00" }), now)).toBe("active");
  });
  it("groups and sorts without mutating, marking complete or canceling saved records", () => {
    const rows = [
      reminder({ id: "tomorrow", date: "2026-10-13" }),
      reminder({ id: "older", date: "2026-10-10" }),
      reminder({ id: "today" }),
      reminder({ id: "canceled", canceled: true }),
      reminder({ id: "done", completed: true }),
      reminder({ id: "recent", date: "2026-10-11" }),
    ];
    const before = JSON.stringify(rows);
    const grouped = groupReminders(rows, now);
    expect(grouped.active.map((r) => r.id)).toEqual(["today", "tomorrow"]);
    expect(grouped.history.map((r) => r.id)).toEqual(["done", "recent", "older"]);
    expect(grouped.canceled.map((r) => r.id)).toEqual(["canceled"]);
    expect(JSON.stringify(rows)).toBe(before);
  });
});
