import type { EnergyPattern } from "@/lib/energy-pattern";

/** Small, optional estimate from a person's own logged hourly pattern.
 * Never extrapolate without a recent check-in or sufficient hourly samples.
 * Returns a non-positive delta; never changes the saved self-report.
 */
export function rhythmAdjustment(pattern: EnergyPattern, latestManualAt: string | null, now: Date): number {
  if (!pattern.reliable || !latestManualAt || pattern.samples < 8) return 0;
  const start = new Date(latestManualAt);
  const elapsed = (now.getTime() - start.getTime()) / 3600000;
  if (!Number.isFinite(elapsed) || elapsed < 0.5 || elapsed > 12 || start.toDateString() !== now.toDateString()) return 0;
  const before = pattern.byHour[start.getHours()];
  const current = pattern.byHour[now.getHours()];
  if (before == null || current == null || !Number.isFinite(before) || !Number.isFinite(current)) return 0;
  // Levels 1–5: 1 step = 25 percentage points. Use only a quarter of the
  // observed difference, at most 1 percentage point per elapsed hour and 6 total.
  const decrease = Math.max(0, before - current) * 25 * 0.25;
  return -Math.round(Math.min(6, elapsed, decrease));
}
