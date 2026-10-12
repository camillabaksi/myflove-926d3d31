/** Exact self-report travels with the existing energy_logs observation, including
 * offline retries and other devices. The integer level remains compatible with
 * legacy readers. No separate capacity store or database migration is needed. */
const PREFIX = "Självskattad energi: ";

export function percentNote(percent: number, note?: string): string {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100)
    throw new Error("Energin måste vara mellan 0 och 100 procent.");
  return `${PREFIX}${Math.round(percent)} %.${note?.trim() ? `\n${note.trim()}` : ""}`;
}

export function energyPercent(entry: { level: number; note?: string | null }): number {
  const match = entry.note?.match(/^Självskattad energi: (\d{1,3}) %\.(?:\n|$)/);
  const exact = match ? Number(match[1]) : NaN;
  return Number.isFinite(exact) && exact >= 0 && exact <= 100
    ? exact
    : Math.round(((Math.min(5, Math.max(1, entry.level)) - 1) / 4) * 100);
}

export const percentToLevel = (percent: number) => 1 + Math.round(percent / 25);
