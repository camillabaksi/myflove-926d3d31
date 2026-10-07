import { AREA_META, LEGACY_AREA_MAP, type LifeArea } from "@/lib/life-areas";
import type { CalendarEntry } from "@/lib/visual-calendar";

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