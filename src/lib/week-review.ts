// 💜 Din vecka – en lugn sammanfattning av veckan som varit.
//
// Två regler styr allt här:
//  1. Vi säger bara sådant som användarens egen data faktiskt stödjer.
//     Finns inte underlaget säger vi att vi fortfarande lär oss.
//  2. Vi mäter aldrig prestation. Frågan är "vad verkar ha fungerat för mig?",
//     aldrig "hur bra följde jag min plan?".

import { addDaysISO, dayOf, parseISODate, toISODate } from "@/lib/day";
import { ENERGY_META, type ActivityEnergy, type ActivityInstance } from "@/lib/activity-history";

export interface EnergyPoint {
  /** 1–5 (appens kanoniska skala). */
  level: number;
  loggedAt: string | number;
}

export interface MoodPoint {
  /** 1–5. */
  score: number;
  date: number | string;
}

export interface WeekReviewInput {
  /** Veckans måndag (YYYY-MM-DD). */
  weekStart: string;
  instances: ActivityInstance[];
  energy: EnergyPoint[];
  moods: MoodPoint[];
  /** Quickflow-saker som fått ett hem under veckan. */
  quickflowDone: { doneAt?: number }[];
}

export interface WeekReview {
  weekStart: string;
  weekEnd: string;
  enoughData: boolean;
  activityCount: number;
  completedCount: number;
  quickflowCount: number;
  energyLogs: number;
  energyLabel: string;
  moodEntries: number;
  moodLabel: string;
  impact: Record<ActivityEnergy, number>;
  /** Kort sammanfattning i löpande text. */
  summary: string;
  /** Observationer som datan faktiskt stödjer. */
  observations: string[];
  /** Frivilliga, milda förslag inför nästa vecka. */
  suggestions: string[];
}

const WEEKDAY_NAMES = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

const WEEKDAY_PLURAL = [
  "söndagar",
  "måndagar",
  "tisdagar",
  "onsdagar",
  "torsdagar",
  "fredagar",
  "lördagar",
];

/** Måndagen i veckan som `iso` ligger i. */
export function weekStartISO(iso: string): string {
  const d = parseISODate(iso);
  const dow = d.getDay(); // 0 = söndag
  const back = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - back);
  return toISODate(d);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
}

export function weekdayName(iso: string): string {
  return WEEKDAY_NAMES[parseISODate(iso).getDay()] ?? "";
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Ord som säger något om vad en aktivitet är. Bara tydliga grupper. */
const CATEGORY_WORDS: { id: string; label: string; words: string[] }[] = [
  {
    id: "utomhus",
    label: "Aktiviteter utomhus",
    words: ["promenad", "ute", "utomhus", "skog", "park", "cykel", "trädgård", "strand", "gå ut"],
  },
  {
    id: "socialt",
    label: "Sociala aktiviteter",
    words: ["fika", "träffa", "besök", "middag med", "kompis", "vän", "familj", "kalas"],
  },
  {
    id: "praktiskt",
    label: "Praktiska ärenden",
    words: ["handla", "tvätt", "städa", "disk", "bank", "räkning", "post", "apotek", "bil"],
  },
];

function categoryOf(title: string): { id: string; label: string } | null {
  const lower = title.toLowerCase();
  for (const cat of CATEGORY_WORDS) {
    if (cat.words.some((w) => lower.includes(w))) return { id: cat.id, label: cat.label };
  }
  return null;
}

export function buildWeekReview(input: WeekReviewInput): WeekReview {
  const { weekStart } = input;
  const days = weekDates(weekStart);
  const weekEnd = days[6]!;
  const inWeek = (iso: string | null) => !!iso && iso >= weekStart && iso <= weekEnd;

  const instances = input.instances.filter((i) => inWeek(i.date) && i.status !== "installd");
  const completed = instances.filter((i) => i.status === "genomford");
  const energy = input.energy.filter((e) => inWeek(dayOf(e.loggedAt)));
  const moods = input.moods.filter((m) => inWeek(dayOf(m.date)));
  const quickflowCount = input.quickflowDone.filter((q) => inWeek(dayOf(q.doneAt))).length;

  const impact: Record<ActivityEnergy, number> = {
    gives: 0,
    neutral: 0,
    drains_little: 0,
    drains_much: 0,
  };
  for (const item of completed) {
    if (item.energyImpact) impact[item.energyImpact] += 1;
  }

  // Ork per dag – grunden för "vilka dagar var lättare/tyngre".
  const energyByDay = new Map<string, number[]>();
  for (const point of energy) {
    const day = dayOf(point.loggedAt);
    if (!day) continue;
    const list = energyByDay.get(day) ?? [];
    list.push(point.level);
    energyByDay.set(day, list);
  }
  const dayAverages = [...energyByDay.entries()]
    .map(([date, levels]) => ({ date, average: avg(levels) }))
    .sort((a, b) => b.average - a.average);

  const spread = dayAverages.length
    ? dayAverages[0]!.average - dayAverages[dayAverages.length - 1]!.average
    : 0;
  const energyAverage = avg(energy.map((e) => e.level));
  const energyLabel = !energy.length
    ? "ingen loggning"
    : spread >= 1
      ? "varierat"
      : energyAverage >= 3.5
        ? "ganska god"
        : energyAverage <= 2.2
          ? "ganska låg"
          : "ganska jämn";

  const moodAverage = avg(moods.map((m) => m.score));
  const moodLabel = !moods.length
    ? "ingen loggning"
    : moodAverage >= 3.5
      ? "mest ljust"
      : moodAverage <= 2.2
        ? "mest tungt"
        : "blandat";

  const enoughData = instances.length + energy.length + moods.length >= 3;

  const observations: string[] = [];
  const suggestions: string[] = [];

  // 1. Lättare och tyngre dagar – kräver minst tre dagar med loggad ork.
  if (dayAverages.length >= 3 && spread >= 1) {
    const best = dayAverages.slice(0, 2).filter((d) => d.average >= dayAverages[0]!.average - 0.4);
    const worst = dayAverages
      .slice()
      .reverse()
      .slice(0, 2)
      .filter((d) => d.average <= dayAverages[dayAverages.length - 1]!.average + 0.4);
    const bestNames = best.map((d) => weekdayName(d.date));
    const worstNames = worst.map((d) => weekdayName(d.date));
    if (bestNames.length && worstNames.length) {
      observations.push(
        `Du hade mest ork på ${bestNames.join(" och ")}, medan ${worstNames.join(" och ")} verkar ha varit tyngre.`,
      );
    }
  }

  // 2. Många aktiviteter → lägre ork dagen efter. Kräver flera dagar båda vägar.
  const countByDay = new Map<string, number>();
  for (const item of instances) countByDay.set(item.date, (countByDay.get(item.date) ?? 0) + 1);
  const counts = days.map((d) => countByDay.get(d) ?? 0);
  const busyThreshold = Math.max(3, avg(counts) + 1);
  const afterBusy: number[] = [];
  const afterCalm: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const next = energyByDay.get(days[i + 1]!);
    if (!next?.length) continue;
    const nextAvg = avg(next);
    if (counts[i]! >= busyThreshold) afterBusy.push(nextAvg);
    else afterCalm.push(nextAvg);
  }
  if (afterBusy.length >= 2 && afterCalm.length >= 2 && avg(afterCalm) - avg(afterBusy) >= 0.7) {
    observations.push("Du hade flera dagar med låg ork efter dagar med många aktiviteter.");
  }

  // 3. Kategorier – bara när tillräckligt många aktiviteter fått ett svar.
  const byCategory = new Map<string, { label: string; scores: number[] }>();
  for (const item of completed) {
    if (!item.energyImpact) continue;
    const cat = categoryOf(item.title);
    if (!cat) continue;
    const entry = byCategory.get(cat.id) ?? { label: cat.label, scores: [] };
    entry.scores.push(ENERGY_META[item.energyImpact].score);
    byCategory.set(cat.id, entry);
  }
  for (const [, entry] of byCategory) {
    if (entry.scores.length < 3) continue;
    const score = avg(entry.scores);
    if (score >= 1) observations.push(`${entry.label} verkar ha gett dig energi.`);
    else if (score <= -1) observations.push(`${entry.label} verkar ha tagit mer av din ork.`);
  }

  // Sammanfattning i klartext.
  let summary: string;
  if (!enoughData) {
    summary =
      "Vi lär fortfarande känna din vardag. Fortsätt använda MyFlove så kan vi ge dig bättre överblick över tid.";
  } else {
    const tone =
      instances.length >= 15
        ? "Det har varit en ganska intensiv vecka."
        : instances.length >= 6
          ? "Det har varit en vecka med lagom mycket på schemat."
          : "Det har varit en ganska lugn vecka.";
    summary = observations.length ? `${tone} ${observations[0]}` : tone;
  }

  // Förslag inför nästa vecka – frivilliga, aldrig krav.
  if (enoughData) {
    const heaviest = days
      .map((d, i) => ({ date: d, count: counts[i]! }))
      .sort((a, b) => b.count - a.count)[0];
    if (heaviest && heaviest.count >= 3 && heaviest.count >= avg(counts) + 1) {
      suggestions.push(
        `Du verkar ha haft mycket på ${WEEKDAY_PLURAL[parseISODate(heaviest.date).getDay()]}. Vill du planera lite mer luft nästa ${weekdayName(heaviest.date)}?`,
      );
    }
    if (impact.drains_much >= 2) {
      suggestions.push(
        "Några saker tog mycket energi den här veckan. Vill du lägga dem på olika dagar nästa vecka?",
      );
    }
    if (impact.gives >= 2 && suggestions.length < 2) {
      suggestions.push(
        "Några saker gav dig energi. Vill du se till att minst en av dem får plats nästa vecka?",
      );
    }
  }

  return {
    weekStart,
    weekEnd,
    enoughData,
    activityCount: instances.length,
    completedCount: completed.length,
    quickflowCount,
    energyLogs: energy.length,
    energyLabel,
    moodEntries: moods.length,
    moodLabel,
    impact,
    summary,
    observations,
    suggestions,
  };
}
