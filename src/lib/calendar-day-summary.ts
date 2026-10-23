import type { PlanningPeriod } from "@/lib/planning";

type DayEntryLike = { id: string; periodEnd?: string };

/**
 * "Just nu"/"Härnäst" visar bara faktiska aktiviteter. En pågående period
 * (t.ex. en kurs) visas redan under "Pågående perioder" och ska varken
 * upprepas här eller bli en avbockningsbar dagsuppgift.
 */
export function nowCandidateIds<T extends DayEntryLike>(entries: readonly T[]): Set<string> {
  return new Set(entries.filter((entry) => !entry.periodEnd).map((entry) => entry.id));
}

/** Svensk singular/plural för aktivitetsantal; översättningen sker hos anroparen. */
export const activityWord = (count: number) => (count === 1 ? "aktivitet" : "aktiviteter");

/** Vilken planeringsperiod ett valt kalenderdatum öppnar. Datumet skickas alltid med. */
export function planningPeriodForDate(date: string, today: string, tomorrow: string): PlanningPeriod {
  return date === today ? "today" : date === tomorrow ? "tomorrow" : "week";
}

/**
 * Ett tidigare utkast får bara styra datum/period om det faktiskt innehåller
 * text eller rader. Ett tomt utkast får aldrig ta över datumet användaren
 * just valde i kalendern.
 */
export function draftOverridesRoute(
  draft: { text: string; rows: readonly unknown[] } | null | undefined,
  requestedPeriod: PlanningPeriod | undefined,
): boolean {
  if (!draft) return false;
  if (!requestedPeriod) return true;
  return Boolean(draft.text.trim() || draft.rows.length);
}
