import { capacityTone } from "@/lib/day-capacity";
import {
  calendarGaps,
  calendarLoad,
  isFamilyEntry,
  minuteOf,
  requiresCalendarTime,
  type CalendarEntry,
} from "@/lib/visual-calendar";

export type PaceLevel = "gentle" | "steady" | "open";

export interface TimeSpace {
  gaps: ReturnType<typeof calendarGaps>;
  tightTransitions: number;
  overlaps: number;
  unknownDurations: number;
}

export interface DayPace {
  level: PaceLevel | null;
  load: ReturnType<typeof calendarLoad>;
  time: TimeSpace;
  reason: "future" | "unknown-capacity" | "unknown-load" | "demanding" | "limited-capacity" | "tight" | "room" | "balanced";
  adjustable: CalendarEntry[];
  planningEntries: CalendarEntry[];
}

/** Own entries lead. Family context counts only with explicit presence, without duplicating its linked parent task. */
export function pacePlanningEntries(entries: CalendarEntry[]): CalendarEntry[] {
  const own = entries.filter((entry) => !isFamilyEntry(entry));
  const ownTaskIds = new Set(own.filter((entry) => entry.source === "task").map((entry) => entry.sourceId));
  return [
    ...own,
    ...entries.filter((entry) => isFamilyEntry(entry) && entry.requiresParent === true && (!entry.parentTaskId || !ownTaskIds.has(entry.parentTaskId))),
  ];
}

/** Only known intervals can prove gaps, tight transitions or overlaps. */
export function knownTimeSpace(entries: CalendarEntry[]): TimeSpace {
  const timed = entries
    .filter((entry) => requiresCalendarTime(entry) && minuteOf(entry.time) !== null)
    .sort((a, b) => (minuteOf(a.time) ?? 0) - (minuteOf(b.time) ?? 0));
  let previousEnd: number | null = null;
  let tightTransitions = 0;
  let overlaps = 0;
  let unknownDurations = 0;
  for (const entry of timed) {
    const start = minuteOf(entry.time);
    const end = minuteOf(entry.endTime);
    if (start === null) continue;
    if (end === null || end <= start) {
      unknownDurations += 1;
      previousEnd = null;
      continue;
    }
    if (previousEnd !== null) {
      if (start < previousEnd) overlaps += 1;
      else if (start - previousEnd < 20) tightTransitions += 1;
    }
    previousEnd = Math.max(previousEnd ?? 0, end);
  }
  return { gaps: calendarGaps(entries), tightTransitions, overlaps, unknownDurations };
}

/** A transparent interpretation, never a score and never persisted. */
export function deriveDayPace({ date, today, capacity, entries }: { date: string; today: string; capacity: number | null; entries: CalendarEntry[] }): DayPace {
  const planningEntries = pacePlanningEntries(entries);
  const load = calendarLoad(planningEntries);
  const time = knownTimeSpace(planningEntries);
  const adjustable = planningEntries.filter((entry) => !isFamilyEntry(entry) && entry.editable && !entry.done);
  if (date > today) return { level: null, load, time, reason: "future", adjustable, planningEntries };
  if (capacity === null) return { level: null, load, time, reason: "unknown-capacity", adjustable, planningEntries };
  const openEntries = planningEntries.filter((entry) => !entry.done && requiresCalendarTime(entry));
  if (openEntries.length > 0 && load.unknown === openEntries.length) return { level: null, load, time, reason: "unknown-load", adjustable, planningEntries };
  if (load.segments >= 3) return { level: "gentle", load, time, reason: "demanding", adjustable, planningEntries };
  if (capacityTone(capacity) === "low" && load.segments >= 1) return { level: "gentle", load, time, reason: "limited-capacity", adjustable, planningEntries };
  if (time.overlaps > 0 || time.tightTransitions >= 2) return { level: "gentle", load, time, reason: "tight", adjustable, planningEntries };
  const fullyKnown = load.unknown === 0 && time.unknownDurations === 0;
  const hasVerifiedRoom = time.gaps.length > 0 || openEntries.length === 0;
  if (capacityTone(capacity) === "high" && load.segments <= 1 && fullyKnown && hasVerifiedRoom) {
    return { level: "open", load, time, reason: "room", adjustable, planningEntries };
  }
  return { level: "steady", load, time, reason: "balanced", adjustable, planningEntries };
}