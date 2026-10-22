import { todayISO } from "@/lib/day";

export interface HourlyEnergySample {
  level: number;
  logged_at: string;
}

export interface HourlyEnergyBucket {
  hour: string;
  avg: number | null;
  n: number;
}

/**
 * Keep all 24 local clock hours in the profile.
 * Missing measurements are null (no measurement), never 0 (lowest energy).
 * This preserves real time spacing instead of stretching sparse readings.
 */
export function hourlyEnergyProfile(samples: readonly HourlyEnergySample[]): {
  hours: HourlyEnergyBucket[];
  observedDays: number;
  supportedPattern: boolean;
  peak: HourlyEnergyBucket | null;
  low: HourlyEnergyBucket | null;
} {
  const buckets = Array.from({ length: 24 }, () => ({ sum: 0, n: 0 }));
  const observedDays = new Set<string>();
  for (const sample of samples) {
    const date = new Date(sample.logged_at);
    if (!Number.isFinite(sample.level) || Number.isNaN(date.getTime()) || sample.level < 1 || sample.level > 5) continue;
    const bucket = buckets[date.getHours()]!;
    bucket.sum += sample.level;
    bucket.n++;
    observedDays.add(todayISO(date));
  }
  const hours = buckets.map((b, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    avg: b.n ? Number((b.sum / b.n).toFixed(2)) : null,
    n: b.n,
  }));
  // Several readings in one day cannot establish a typical time-of-day pattern.
  // Require distinct observed days AND repeated observations in at least two hours.
  const stableHours = hours.filter((b) => b.n >= 2 && b.avg != null);
  const supportedPattern = observedDays.size >= 3 && stableHours.length >= 2;
  const sorted = supportedPattern ? [...stableHours].sort((a, b) => b.avg! - a.avg!) : [];
  return {
    hours,
    observedDays: observedDays.size,
    supportedPattern,
    peak: sorted[0] ?? null,
    low: sorted.at(-1) ?? null,
  };
}
