import { calendarGaps, calendarLoad, isFamilyEntry, type CalendarEntry } from "@/lib/visual-calendar";

/** A single observation from actual day data, not a score or a recommendation engine. */
export function flowDaySupport(entries: CalendarEntry[], percent: number | null): { message: string; prioritize: boolean } {
  const own = entries.filter(e => !isFamilyEntry(e));
  const family = entries.filter(isFamilyEntry);
  const presence = family.filter(e => e.requiresParent);
  const load = calendarLoad(entries);
  if (load.segments >= 3) return { message: "Det är ganska mycket på planen. Vill du se vad som faktiskt behöver ske idag?", prioritize: true };
  if (presence.length >= 2) return { message: "Det är flera familjetider där du behövs idag. Vi kan ta en tid i taget.", prioritize: false };
  if (own.filter(e => !e.done).length <= 2 && family.length >= 3) return { message: "Du har inte så mycket eget planerat, men familjen tar en del plats idag.", prioritize: false };
  if (percent !== null && percent <= 50) return { message: `${percent} % idag. Vi kan hålla planen lite mjuk.`, prioritize: false };
  if (own.some(e => e.energyImpact === "gives")) return { message: "Du gjorde plats för återhämtning också.", prioritize: false };
  if (calendarGaps(entries).length) return { message: "Här finns lite luft mellan sakerna. Den behöver inte fyllas.", prioritize: false };
  if (own.filter(e => e.done).length >= 3) return { message: "Du har redan tagit dig igenom en del idag.", prioritize: false };
  return { message: percent === null ? "Vi börjar där du är idag. En sak i taget räcker." : `${percent} % idag. Då planerar vi utifrån det.`, prioritize: false };
}