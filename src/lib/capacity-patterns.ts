/**
 * Personliga mönster – byggs ENBART på användarens egen registrerade data.
 * MyFlove hittar aldrig på mönster och antar aldrig att en viss fas eller
 * diagnos ger ett visst mående. Formuleringarna är försiktiga ("du verkar…",
 * "du har ofta registrerat…") och visas först när underlaget räcker.
 */
import { averageCycleLength, dayKey, periodStarts, type CycleData } from "@/lib/cycle";
import type { ImpactEntry, ImpactKind } from "@/lib/impact-checkin";

export interface CapacityPattern {
  id: string;
  textSv: string;
}

/** Snittenergi (1–5) per dag av användarens egna loggar. */
export function energyByDay(entries: { level: number; logged_at: string }[]): Map<string, number> {
  const buckets = new Map<string, number[]>();
  for (const e of entries) {
    const key = dayKey(new Date(e.logged_at));
    const list = buckets.get(key) ?? [];
    list.push(e.level);
    buckets.set(key, list);
  }
  const out = new Map<string, number>();
  for (const [key, list] of buckets) {
    out.set(key, list.reduce((a, b) => a + b, 0) / list.length);
  }
  return out;
}

const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length;

const shift = (day: string, delta: number) =>
  dayKey(new Date(new Date(`${day}T12:00:00`).getTime() + delta * 86_400_000));

/**
 * Mönster kopplade till cykeln. Kräver minst tre registrerade cykelstarter
 * och tillräckligt många energiloggar – annars returneras inget.
 */
export function cyclePatterns(cycle: CycleData, energy: Map<string, number>): CapacityPattern[] {
  if (!cycle.enabled) return [];
  const starts = periodStarts(cycle.periodDays);
  if (starts.length < 3 || energy.size < 10) return [];

  const patterns: CapacityPattern[] = [];
  const before: number[] = [];
  for (const start of starts.slice(0, 4)) {
    for (const delta of [-3, -2, -1]) {
      const v = energy.get(shift(start, delta));
      if (v != null) before.push(v);
    }
  }
  const all = [...energy.values()];
  if (before.length >= 4 && avg(before) < avg(all) - 0.4) {
    patterns.push({
      id: "pre-mens-lag-kapacitet",
      textSv:
        "Du verkar ofta ha registrerat lägre kapacitet dagarna före mens. Det är ditt eget mönster – inte en regel.",
    });
  }

  const length = averageCycleLength(cycle.periodDays);
  const tired = cycle.symptoms.filter((s) => s.kinds.includes("trotthet"));
  if (tired.length >= 3) {
    patterns.push({
      id: "cykel-trotthet",
      textSv: `Du har ofta registrerat mer trötthet under delar av din cykel (uppskattad cykellängd ${length} dagar).`,
    });
  }
  return patterns;
}

/** Mönster från registrerad påverkan, t.ex. sömn. */
export function impactPatterns(
  history: ImpactEntry[],
  energy: Map<string, number>,
): CapacityPattern[] {
  if (history.length < 6 || energy.size < 10) return [];
  const all = [...energy.values()];
  const out: CapacityPattern[] = [];
  const check: { kind: ImpactKind; id: string; textSv: string }[] = [
    {
      kind: "somn",
      id: "somn-lag-kapacitet",
      textSv: "Du verkar ofta ha lägre kapacitet efter nätter med lite sömn.",
    },
    {
      kind: "familj",
      id: "familj-lag-kapacitet",
      textSv:
        "Du har ofta registrerat lägre kapacitet de dagar då familj och barn tar mycket energi.",
    },
  ];
  for (const c of check) {
    const days = history.filter((h) => h.kinds.includes(c.kind)).map((h) => energy.get(h.day));
    const values = days.filter((v): v is number => v != null);
    if (values.length >= 3 && avg(values) < avg(all) - 0.4) {
      out.push({ id: c.id, textSv: c.textSv });
    }
  }
  return out;
}
