import type { DayCapacity } from "@/lib/day-capacity";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

/**
 * An optional, explicitly user-reported activity adjustment to the last
 * manual capacity check-in. Never treat planned activities as measurements.
 * Existing factor IDs are unique; editing a factor replaces its contribution.
 */
export function capacityWithActivityFeedback(
  baseline: DayCapacity,
  date: string,
  factors: readonly EnergyFactorEntry[],
  latestManualAt?: string | null,
): DayCapacity {
  if (baseline.percent == null || baseline.source == null) return baseline;
  const cutoff = latestManualAt ? Date.parse(latestManualAt) : NaN;
  // Without a reliable timestamp, don't retroactively modify a check-in.
  if (!Number.isFinite(cutoff)) return baseline;
  const seen = new Set<string>();
  let change = 0;
  for (const factor of factors) {
    if (seen.has(factor.id)) continue;
    seen.add(factor.id);
    if (factor.kind !== "planerat" || factor.note !== "Genomförd aktivitet") continue;
    const time = Date.parse(factor.occurredAt);
    if (!Number.isFinite(time) || time <= cutoff) continue;
    const local = new Date(time);
    const factorDate = [local.getFullYear(), String(local.getMonth() + 1).padStart(2, "0"), String(local.getDate()).padStart(2, "0")].join("-");
    if (factorDate !== date) continue;
    const points = Math.min(5, Math.max(0, factor.strength)) * 2;
    if (factor.direction === "gives") change += points;
    if (factor.direction === "drains") change -= points;
    // Both / neutral are recorded in history, but not assumed to change net energy.
  }
  if (change === 0) return baseline;
  return { ...baseline, percent: Math.min(100, Math.max(0, baseline.percent + change)) };
}
