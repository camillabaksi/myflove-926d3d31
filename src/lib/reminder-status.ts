import type { Reminder } from "@/hooks/use-data";
import { parseISODate, todayISO } from "@/lib/day";

export type ReminderStatus = "active" | "passed" | "completed" | "canceled";

type StatusSource = Pick<
  Reminder,
  "date" | "endDate" | "time" | "endTime" | "repeat" | "completed" | "canceled"
>;

/** View-only status. A passed time says nothing about notification delivery. */
export function reminderStatus(reminder: StatusSource, now = new Date()): ReminderStatus {
  if (reminder.canceled) return "canceled";
  const recurring = (reminder.repeat ?? "none") !== "none";
  if (reminder.completed && !recurring) return "completed";
  // A recurring reminder is a rule, not an expired first occurrence.
  if (recurring) return "active";

  const date =
    reminder.endDate && reminder.endDate > reminder.date ? reminder.endDate : reminder.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "active";
  const end = parseISODate(date);
  if (!Number.isFinite(end.getTime()) || todayISO(end) !== date) return "active";
  const time =
    reminder.endTime ||
    (reminder.endDate && reminder.endDate > reminder.date ? undefined : reminder.time);
  if (time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return "active";
    const [hour, minute] = time.split(":").map(Number);
    end.setHours(hour, minute, 0, 0);
  } else {
    // Untimed reminders and periods remain current through their last local day.
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  }
  return now.getTime() >= end.getTime() ? "passed" : "active";
}

export function groupReminders(reminders: readonly Reminder[], now = new Date()) {
  const active: Reminder[] = [];
  const history: Reminder[] = [];
  const canceled: Reminder[] = [];
  for (const reminder of reminders) {
    const status = reminderStatus(reminder, now);
    if (status === "active") active.push(reminder);
    else if (status === "canceled") canceled.push(reminder);
    else history.push(reminder);
  }
  const order = (a: Reminder, b: Reminder) =>
    a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");
  active.sort(order);
  history.sort((a, b) => order(b, a));
  canceled.sort((a, b) => order(b, a));
  return { active, history, canceled };
}
