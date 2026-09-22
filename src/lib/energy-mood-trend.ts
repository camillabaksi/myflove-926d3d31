import type { EnergyFactorEntry } from "@/lib/energy-flow";
import type { MoodEntry } from "@/hooks/use-data";

/**
 * Trend för energi och mående över vecka och månad.
 * Ren beräkning på befintliga källor – Energiflöde™ (energy_factors) och
 * måendeloggen ("myflow-moods"). Ingen ny lagring, inga nya anrop.
 */
export type TrendRange = "weeks" | "months";

export interface TrendPeriod {
  key: string;
  label: string;
  accessibleLabel: string;
  /** 0–100, null när inget loggats den perioden. */
  energy: number | null;
  /** 0–100, null när inget mående loggats. */
  mood: number | null;
  energyLogs: number;
  moodLogs: number;
}

export interface EnergyMoodTrend {
  periods: Record<TrendRange, TrendPeriod[]>;
  summary: string;
  direction: "up" | "down" | "flat" | "unknown";
}

const WEEKS = 8;
const MONTHS = 6;

const MONTH_LABELS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

/** Måndag som veckostart, lokal tid. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

function energyValue(entry: EnergyFactorEntry): number {
  if (entry.direction === "gives") return entry.strength;
  if (entry.direction === "drains") return -entry.strength;
  return 0;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** −5…5 → 0…100 */
const energyToPercent = (mean: number): number =>
  Math.round(Math.max(0, Math.min(100, ((mean + 5) / 10) * 100)));

/** 1…5 → 0…100 */
const moodToPercent = (mean: number): number =>
  Math.round(Math.max(0, Math.min(100, ((mean - 1) / 4) * 100)));

interface Bucket {
  key: string;
  label: string;
  accessibleLabel: string;
  start: number;
  end: number;
}

function weekBuckets(now: Date): Bucket[] {
  const current = startOfWeek(now);
  const out: Bucket[] = [];
  for (let i = WEEKS - 1; i >= 0; i -= 1) {
    const start = new Date(current);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const week = isoWeekNumber(start);
    out.push({
      key: `w-${start.getFullYear()}-${week}`,
      label: `v ${week}`,
      accessibleLabel: `Vecka ${week}`,
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  return out;
}

function monthBuckets(now: Date): Bucket[] {
  const out: Bucket[] = [];
  for (let i = MONTHS - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({
      key: `m-${start.getFullYear()}-${start.getMonth()}`,
      label: MONTH_LABELS[start.getMonth()] ?? "",
      accessibleLabel: `${MONTH_LABELS[start.getMonth()] ?? ""} ${start.getFullYear()}`,
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  return out;
}

function fill(
  buckets: Bucket[],
  entries: EnergyFactorEntry[],
  moods: MoodEntry[],
): TrendPeriod[] {
  const energyTimes = entries.map((e) => ({ t: new Date(e.occurredAt).getTime(), v: energyValue(e) }));
  const moodTimes = moods.map((m) => ({ t: m.date, v: m.score }));
  return buckets.map((b) => {
    const energyValues = energyTimes.filter((e) => e.t >= b.start && e.t < b.end).map((e) => e.v);
    const moodValues = moodTimes.filter((m) => m.t >= b.start && m.t < b.end).map((m) => m.v);
    const energyMean = average(energyValues);
    const moodMean = average(moodValues);
    return {
      key: b.key,
      label: b.label,
      accessibleLabel: b.accessibleLabel,
      energy: energyMean == null ? null : energyToPercent(energyMean),
      mood: moodMean == null ? null : moodToPercent(moodMean),
      energyLogs: energyValues.length,
      moodLogs: moodValues.length,
    };
  });
}

function describe(periods: TrendPeriod[]): { summary: string; direction: EnergyMoodTrend["direction"] } {
  const withData = periods.filter((p) => p.energy != null || p.mood != null);
  if (withData.length === 0) {
    return {
      summary: "Trenden börjar synas när du loggat energi eller mående några gånger.",
      direction: "unknown",
    };
  }
  const score = (p: TrendPeriod): number | null => {
    const parts = [p.energy, p.mood].filter((v): v is number => v != null);
    return parts.length === 0 ? null : parts.reduce((s, v) => s + v, 0) / parts.length;
  };
  const last = score(withData[withData.length - 1]!);
  const before = withData.length > 1 ? score(withData[withData.length - 2]!) : null;
  if (last == null || before == null) {
    return {
      summary: "Här syns din energi och ditt mående vecka för vecka och månad för månad.",
      direction: "unknown",
    };
  }
  const diff = last - before;
  if (diff >= 5)
    return { summary: "Senaste perioden ligger något högre än perioden innan.", direction: "up" };
  if (diff <= -5)
    return { summary: "Senaste perioden ligger något lägre än perioden innan.", direction: "down" };
  return { summary: "Senaste perioden ligger ungefär i nivå med perioden innan.", direction: "flat" };
}

export function buildEnergyMoodTrend(
  entries: EnergyFactorEntry[],
  moods: MoodEntry[],
  now: Date = new Date(),
): EnergyMoodTrend {
  const weeks = fill(weekBuckets(now), entries, moods);
  const months = fill(monthBuckets(now), entries, moods);
  const { summary, direction } = describe(weeks);
  return { periods: { weeks, months }, summary, direction };
}
