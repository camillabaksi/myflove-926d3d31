import { routineOccursOn, type Routine } from "./recurrence";

/** An exception is keyed by the ORIGINAL occurrence date, even when moved. */
export interface RoutineOccurrenceException {
  routineId: string;
  occurrenceDate: string; // YYYY-MM-DD
  status: "skipped" | "rescheduled";
  date?: string; // destination day, default original
  time?: string; // HH:mm, default routine time
}

export interface ResolvedRoutineOccurrence {
  routineId: string;
  occurrenceDate: string;
  date: string;
  time: string;
  skipped: boolean;
}

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T12:00:00"));
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** Keep one exception per routine and original date; never mutate the recurring rule. */
export function upsertRoutineException(
  exceptions: RoutineOccurrenceException[],
  next: RoutineOccurrenceException,
): RoutineOccurrenceException[] {
  if (!validDate(next.occurrenceDate) || (next.date && !validDate(next.date)) ||
      (next.time && !validTime(next.time))) throw new Error("Invalid routine occurrence date or time");
  return [...exceptions.filter(item =>
    item.routineId !== next.routineId || item.occurrenceDate !== next.occurrenceDate), next];
}

export function removeRoutineException(
  exceptions: RoutineOccurrenceException[], routineId: string, occurrenceDate: string,
): RoutineOccurrenceException[] {
  return exceptions.filter(item => item.routineId !== routineId || item.occurrenceDate !== occurrenceDate);
}

/** Resolve both original and moved occurrences on a day without duplicates. */
export function routineOccurrencesForDay(
  routine: Routine, day: string, exceptions: RoutineOccurrenceException[],
): ResolvedRoutineOccurrence[] {
  if (!routine.enabled || !validDate(day)) return [];
  const own = exceptions.filter(item => item.routineId === routine.id);
  const byOrigin = new Map(own.map(item => [item.occurrenceDate, item]));
  const origins = new Set<string>();
  if (routineOccursOn(routine, day)) origins.add(day);
  for (const item of own) if (item.status === "rescheduled" && (item.date ?? item.occurrenceDate) === day) origins.add(item.occurrenceDate);
  return [...origins].flatMap(origin => {
    if (!routineOccursOn(routine, origin)) return [];
    const exception = byOrigin.get(origin);
    if (exception?.status === "skipped") return [];
    const date = exception?.status === "rescheduled" ? (exception.date ?? origin) : origin;
    if (date !== day) return [];
    return [{ routineId: routine.id, occurrenceDate: origin, date, time: exception?.time ?? routine.time, skipped: false }];
  });
}
