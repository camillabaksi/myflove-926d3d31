/** ISO-8601 veckonummer (vecka börjar måndag, vecka 1 innehåller 4 januari). */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Veckonummer för ett ISO-datum (YYYY-MM-DD). */
export function isoWeekNumberFromString(dateStr: string): number {
  return isoWeekNumber(new Date(`${dateStr}T12:00:00`));
}
