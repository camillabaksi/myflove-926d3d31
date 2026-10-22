import { dayOf, todayISO } from "@/lib/day";

/**
 * A plan's due date and the date an activity actually happened are independent.
 * For a backdated observation with no known time, use local noon; this avoids
 * UTC midnight/DST day shifts without pretending to know the real hour.
 */
export function energyOccurredAtForDay(
  actualDate: string,
  existingOccurredAt?: string,
  now: Date = new Date(),
): string {
  const today = todayISO(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualDate) || actualDate > today)
    throw new Error("Välj dagens datum eller ett tidigare datum.");
  if (existingOccurredAt && dayOf(existingOccurredAt) === actualDate)
    return existingOccurredAt;

  if (actualDate === today) return now.toISOString();

  const [year, month, day] = actualDate.split("-").map(Number);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (dayOf(localNoon) !== actualDate)
    throw new Error("Välj ett giltigt datum.");
  return localNoon.toISOString();
}

/** Defaults to the planned date for unreported overdue activities. Existing
 * observations keep their original day unless the user changes it explicitly. */
export function initialActualDate(
  plannedDate: string | undefined,
  existingOccurredAt?: string,
  now: Date = new Date(),
): string {
  const today = todayISO(now);
  const existingDate = dayOf(existingOccurredAt);
  if (existingDate && existingDate <= today) return existingDate;
  return plannedDate && plannedDate < today ? plannedDate : today;
}
