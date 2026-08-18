import type { MoodEntry } from "@/hooks/use-data";

export interface DayStat {
  date: string; // YYYY-MM-DD
  label: string; // short weekday label
  avg: number | null;
  count: number;
}

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0] as string;
}

const WEEKDAY_LABELS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

export function getWeeklyMoodStats(moods: MoodEntry[]): {
  days: DayStat[];
  weekAvg: number | null;
  previousWeekAvg: number | null;
  trend: "up" | "down" | "same" | null;
  checkins: number;
} {
  const days: DayStat[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0] as string;
    const dayMoods = moods.filter((m) => toDateString(m.date) === dateStr);
    const avg =
      dayMoods.length > 0 ? dayMoods.reduce((sum, m) => sum + m.score, 0) / dayMoods.length : null;
    days.push({
      date: dateStr,
      label: WEEKDAY_LABELS[d.getDay()] as string,
      avg,
      count: dayMoods.length,
    });
  }

  const weekEntries = days.filter((d) => d.avg !== null);
  const weekAvg =
    weekEntries.length > 0
      ? weekEntries.reduce((sum, d) => sum + (d.avg as number), 0) / weekEntries.length
      : null;

  const prevStart = new Date(now);
  prevStart.setDate(now.getDate() - 13);
  const prevEnd = new Date(now);
  prevEnd.setDate(now.getDate() - 7);
  const prevMoods = moods.filter((m) => {
    const t = m.date;
    return t >= prevStart.setHours(0, 0, 0, 0) && t < prevEnd.setHours(0, 0, 0, 0);
  });
  const previousWeekAvg =
    prevMoods.length > 0 ? prevMoods.reduce((sum, m) => sum + m.score, 0) / prevMoods.length : null;

  let trend: "up" | "down" | "same" | null = null;
  if (weekAvg !== null && previousWeekAvg !== null) {
    const diff = weekAvg - previousWeekAvg;
    trend = diff > 0.15 ? "up" : diff < -0.15 ? "down" : "same";
  }

  const checkins = moods.filter((m) => days.some((d) => d.date === toDateString(m.date))).length;

  return { days, weekAvg, previousWeekAvg, trend, checkins };
}
