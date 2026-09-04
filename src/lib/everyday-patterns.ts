// MyFlove lär sig din vardag.
//
// Allt här bygger på data som redan finns i appen: dina aktiviteter
// (uppgifter och påminnelser) och dina energiloggar. Inga nya datamodeller,
// inga antaganden – finns det inte tillräckligt underlag säger vi ingenting.

export interface ActivitySample {
  /** Rubriken användaren själv skrev. */
  title: string;
  /** Datum aktiviteten hör till (YYYY-MM-DD). */
  date: string;
}

export interface EnergySample {
  /** Energinivå på appens kanoniska skala (1–5). */
  level: number;
  /** Tidpunkt (ISO). */
  loggedAt: string;
}

export interface WeekdayLoad {
  /** 0 = söndag … 6 = lördag (samma som Date.getDay). */
  weekday: number;
  label: string;
  /** Snitt antal aktiviteter den veckodagen. */
  average: number;
  /** Snitt över alla veckodagar. */
  overall: number;
}

export interface DrainingActivity {
  /** Ordet/aktiviteten som återkommer, t.ex. "tvätt". */
  label: string;
  /** Snittenergi de dagar aktiviteten finns. */
  average: number;
  /** Snittenergi övriga dagar. */
  baseline: number;
  /** Antal dagar underlaget bygger på. */
  days: number;
}

export interface EverydayPatterns {
  /** Har MyFlove sett tillräckligt för att våga säga något? */
  ready: boolean;
  /** Antal dagar med aktiviteter i underlaget. */
  activityDays: number;
  /** Antal energiloggar i underlaget. */
  energyLogs: number;
  busiest: WeekdayLoad | null;
  calmest: WeekdayLoad | null;
  draining: DrainingActivity | null;
}

const WEEKDAY_LABELS = [
  "söndagar",
  "måndagar",
  "tisdagar",
  "onsdagar",
  "torsdagar",
  "fredagar",
  "lördagar",
];

/** Hur långt bakåt vi tittar. Vardagen förändras – gammalt ska inte styra. */
export const PATTERN_WINDOW_DAYS = 56;

/** Ord som inte säger något om vad en aktivitet är. */
const STOPWORDS = new Set([
  "till",
  "från",
  "hela",
  "till",
  "och",
  "eller",
  "med",
  "för",
  "den",
  "det",
  "min",
  "mitt",
  "mina",
  "ett",
  "efter",
  "innan",
  "idag",
  "imorgon",
  "morgon",
  "kväll",
  "igen",
  "extra",
  "lite",
  "kolla",
  "göra",
  "gjorde",
  "detta",
  "saker",
]);

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Nyckelord ur en aktivitetsrubrik – lågupplöst med flit. */
export function activityKeywords(title: string): string[] {
  return Array.from(
    new Set(
      title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
    ),
  );
}

/** Snitt av en sifferlista. */
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function buildEverydayPatterns(input: {
  activities: ActivitySample[];
  energy: EnergySample[];
  now?: Date;
}): EverydayPatterns {
  const now = input.now ?? new Date();
  const today = isoDay(now);
  const inWindow = (iso: string) => {
    const diff = daysBetween(iso, today);
    return Number.isFinite(diff) && diff >= 0 && diff <= PATTERN_WINDOW_DAYS;
  };

  const activities = input.activities.filter((a) => a.title.trim() && inWindow(a.date));
  const energy = input.energy.filter((e) => {
    const iso = e.loggedAt.slice(0, 10);
    return Number.isFinite(e.level) && inWindow(iso);
  });

  /* ---- Vilka dagar har du mycket på? ---- */
  const perDay = new Map<string, number>();
  for (const a of activities) perDay.set(a.date, (perDay.get(a.date) ?? 0) + 1);
  const activityDays = perDay.size;

  const weekdayTotals = Array.from({ length: 7 }, () => ({ total: 0, days: 0 }));
  // Alla dagar i fönstret räknas, även tomma – annars ser varje dag lika full ut.
  for (let d = 0; d <= PATTERN_WINDOW_DAYS; d++) {
    const date = new Date(Date.parse(today) - d * 86_400_000);
    const iso = isoDay(date);
    const bucket = weekdayTotals[date.getUTCDay()];
    bucket.total += perDay.get(iso) ?? 0;
    bucket.days += 1;
  }

  const loads: WeekdayLoad[] = weekdayTotals.map((b, weekday) => ({
    weekday,
    label: WEEKDAY_LABELS[weekday],
    average: b.days ? b.total / b.days : 0,
    overall: 0,
  }));
  const overall = mean(loads.map((l) => l.average));
  for (const l of loads) l.overall = overall;

  const enoughForWeekday = activities.length >= 10 && activityDays >= 5;
  const sorted = [...loads].sort((a, b) => b.average - a.average);
  const busiest =
    enoughForWeekday && sorted[0].average >= overall * 1.3 && sorted[0].average > 0
      ? sorted[0]
      : null;
  const lowest = sorted[sorted.length - 1];
  const calmest = enoughForWeekday && lowest.average <= overall * 0.7 ? lowest : null;

  /* ---- Vilka aktiviteter tar energi? ---- */
  const energyByDay = new Map<string, number[]>();
  for (const e of energy) {
    const iso = e.loggedAt.slice(0, 10);
    const list = energyByDay.get(iso) ?? [];
    list.push(e.level);
    energyByDay.set(iso, list);
  }
  const dayEnergy = new Map<string, number>();
  for (const [iso, levels] of energyByDay) dayEnergy.set(iso, mean(levels));

  const keywordDays = new Map<string, Set<string>>();
  for (const a of activities) {
    if (!dayEnergy.has(a.date)) continue;
    for (const word of activityKeywords(a.title)) {
      const set = keywordDays.get(word) ?? new Set<string>();
      set.add(a.date);
      keywordDays.set(word, set);
    }
  }

  let draining: DrainingActivity | null = null;
  if (dayEnergy.size >= 6) {
    for (const [word, days] of keywordDays) {
      if (days.size < 3) continue;
      const withDays = [...days].map((d) => dayEnergy.get(d)!);
      const withoutDays = [...dayEnergy.entries()]
        .filter(([d]) => !days.has(d))
        .map(([, v]) => v);
      if (withoutDays.length < 3) continue;
      const average = mean(withDays);
      const baseline = mean(withoutDays);
      if (baseline - average < 0.4) continue;
      if (!draining || baseline - average > draining.baseline - draining.average) {
        draining = { label: word, average, baseline, days: days.size };
      }
    }
  }

  return {
    ready: Boolean(busiest || calmest || draining),
    activityDays,
    energyLogs: energy.length,
    busiest,
    calmest,
    draining,
  };
}

/** Korta meningar i du-form – det som faktiskt visas för användaren. */
export function everydayPatternLines(p: EverydayPatterns): string[] {
  const lines: string[] = [];
  if (p.busiest) {
    lines.push(
      `Dina ${p.busiest.label} brukar vara fullast – i snitt ${p.busiest.average.toFixed(1)} saker mot ${p.busiest.overall.toFixed(1)} en vanlig dag.`,
    );
  }
  if (p.calmest) {
    lines.push(`Dina ${p.calmest.label} brukar vara lugnast – bra dag att återhämta dig på.`);
  }
  if (p.draining) {
    lines.push(
      `Dagar med "${p.draining.label}" brukar ta mer energi än andra dagar (${p.draining.days} dagar hittills).`,
    );
  }
  return lines;
}
