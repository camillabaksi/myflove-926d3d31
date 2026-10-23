import { occursOn } from "./recurrence";
import type { Reminder } from "@/hooks/use-data";

/**
 * Overrides belong to their original occurrence date, not the destination.
 * The recurring rule and default time are never modified by a single move.
 */
export type ReminderOccurrenceOverride = { date: string; time: string };
export type ReminderOccurrence = {
  occurrenceDate: string;
  date: string;
  time?: string;
  endTime?: string;
  moved: boolean;
};

type Source = Pick<Reminder, "date" | "repeat" | "endDate" | "time" | "endTime" | "occurrenceOverrides">;

const validDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return !Number.isNaN(d.getTime()) &&
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === value;
};
const validTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const toMinute = (time?: string): number | null => time && validTime(time) ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) : null;
const fromMinute = (minute: number): string => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** Preserve a known end time's duration, but never imply one if it is unknown. */
function shiftedEnd(source: Source, time?: string): string | undefined {
  const originalStart = toMinute(source.time);
  const originalEnd = toMinute(source.endTime);
  const next = toMinute(time);
  if (originalStart === null || originalEnd === null || next === null || originalEnd <= originalStart) return undefined;
  const end = next + originalEnd - originalStart;
  return end < 1440 ? fromMinute(end) : undefined;
}

export function reminderOccurrencesForDay(source: Source, day: string): ReminderOccurrence[] {
  if (!validDate(day)) return [];
  const repeated = (source.repeat ?? "none") !== "none";
  // Long-running periods and ordinary one-offs use their existing projection.
  if (!repeated || source.endDate) {
    return occursOn(source.date, source.repeat, day)
      ? [{ occurrenceDate: day, date: day, time: source.time, endTime: source.endTime, moved: false }]
      : [];
  }

  const output: ReminderOccurrence[] = [];
  if (occursOn(source.date, source.repeat, day)) {
    const change = source.occurrenceOverrides?.[day];
    if (!change || change.date === day) output.push({
      occurrenceDate: day, date: day,
      time: change?.time ?? source.time,
      endTime: change ? shiftedEnd(source, change.time) : source.endTime,
      moved: !!change,
    });
  }

  for (const [original, change] of Object.entries(source.occurrenceOverrides ?? {})) {
    if (original === day || !validDate(original) || !occursOn(source.date, source.repeat, original)) continue;
    if (!validDate(change.date) || !validTime(change.time) || change.date !== day) continue;
    output.push({
      occurrenceDate: original, date: day, time: change.time,
      endTime: shiftedEnd(source, change.time), moved: true,
    });
  }
  return output.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") ||
    a.occurrenceDate.localeCompare(b.occurrenceDate));
}

/** Prepare a complete map to be saved atomically in the existing reminder row. */
export function moveReminderOccurrence(
  source: Source,
  original: string,
  date: string,
  time: string,
): Reminder["occurrenceOverrides"] {
  if ((source.repeat ?? "none") === "none" || source.endDate ||
    !validDate(original) || !occursOn(source.date, source.repeat, original) ||
    !validDate(date) || !validTime(time))
    throw new Error("Ogiltigt datum eller tid för återkommande påminnelse.");
  const updated = { ...source.occurrenceOverrides };
  if (date === original && time === source.time) delete updated[original];
  else updated[original] = { date, time };
  return Object.keys(updated).length ? updated : undefined;
}

export function restoreReminderOccurrence(source: Source, original: string): Reminder["occurrenceOverrides"] {
  const updated = { ...source.occurrenceOverrides };
  delete updated[original];
  return Object.keys(updated).length ? updated : undefined;
}
