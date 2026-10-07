import { AREA_META, LEGACY_AREA_MAP, type LifeArea } from "@/lib/life-areas";
import { isFamilyEntry, type CalendarEntry } from "@/lib/visual-calendar";

/** Presentation only: preserve explicit areas and use known sources, not titles. */
export function calendarArea(entry: CalendarEntry): LifeArea | "external" {
  if (entry.source === "child") return "barn";
  if (entry.source === "family") return "privat";
  if (entry.source === "study" || entry.href === "/studyflow") return "studier";
  if (entry.area && Object.hasOwn(AREA_META, entry.area)) return entry.area as LifeArea;
  const legacy = entry.area ? LEGACY_AREA_MAP[entry.area] : undefined;
  if (legacy) return legacy;
  if (entry.source === "external") return "external";
  return "vardag";
}

export function calendarAreaLabel(area: LifeArea | "external"): string {
  return area === "external" ? "Extern kalender" : AREA_META[area].label;
}

/** Month summarizes areas, never activity volume; all family context is one area. */
export function calendarMonthAreas(entries: CalendarEntry[]): Array<LifeArea | "external"> {
  return [...new Set(entries.map(e => isFamilyEntry(e) ? "privat" as const : calendarArea(e)))];
}

export function calendarMonthCapacity(date: string, today: string, percent: number | null): number | null {
  return date > today ? null : percent;
}