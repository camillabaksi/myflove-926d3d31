/**
 * Sambandet mellan förväntad och faktisk dag.
 *
 * Kvällschecken ("Hur blev dagen?") sparas tillsammans med dagens ork,
 * batterinivå och antal saker. Här jämförs det som var förväntat med hur
 * dagen faktiskt kändes – utan värdering, bara ett lugnt mönster.
 */

import type { EveningAnswer } from "@/lib/day-journey";

export interface EveningSample {
  day: string;
  answer: EveningAnswer;
  ork10?: number | null;
  battery?: number | null;
  planned?: number;
  done?: number;
}

export interface EveningInsight {
  /** Antal kvällar som ligger till grund för mönstret. */
  days: number;
  /** Kort rad om dagens förväntan jämfört med utfallet. */
  todayLine: string | null;
  /** En lugn observation över tid, t.ex. hur många saker som brukar funka. */
  patternLine: string | null;
  /** Snittantal saker de dagar som blev ungefär som väntat eller lättare. */
  comfortableLoad: number | null;
}

/** Så här mycket dagen var planerad för, i förhållande till orken. */
export function expectedLoad(sample: EveningSample): "lugn" | "rimlig" | "full" | null {
  const planned = sample.planned ?? 0;
  const ork = sample.ork10 ?? null;
  if (ork == null && planned === 0) return null;
  const capacity = ork != null ? Math.max(1, Math.round(ork / 2)) : 3;
  if (planned <= capacity - 1) return "lugn";
  if (planned <= capacity + 1) return "rimlig";
  return "full";
}

const avg = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function buildEveningInsight(history: EveningSample[], today?: EveningSample | null): EveningInsight {
  const days = history.length;

  let todayLine: string | null = null;
  if (today) {
    const load = expectedLoad(today);
    const planned = today.planned ?? 0;
    const done = today.done ?? 0;
    if (today.answer === "tyngre") {
      todayLine =
        load === "full"
          ? `Dagen var planerad för ${planned} saker med den ork du hade – att den kändes tyngre är rimligt.`
          : "Dagen såg lugn ut på pappret men kändes tyngre. Något utanför planen kostade energi.";
    } else if (today.answer === "lattare") {
      todayLine =
        done > 0
          ? `Du gjorde ${done} av ${planned} saker och dagen kändes lättare än väntat.`
          : "Dagen kändes lättare än väntat.";
    } else {
      todayLine = `Dagen blev ungefär som förväntat – ${done} av ${planned} saker.`;
    }
  }

  const ok = history.filter((h) => h.answer !== "tyngre");
  const comfortableLoad = avg(ok.map((h) => h.planned ?? 0).filter((n) => n > 0));

  let patternLine: string | null = null;
  if (days >= 3) {
    const heavy = history.filter((h) => h.answer === "tyngre");
    const heavyLoad = avg(heavy.map((h) => h.planned ?? 0).filter((n) => n > 0));
    if (comfortableLoad != null && heavyLoad != null && heavyLoad - comfortableLoad >= 1) {
      patternLine = `Dina dagar brukar kännas som väntat vid ungefär ${Math.round(comfortableLoad)} saker, och tyngre runt ${Math.round(heavyLoad)}.`;
    } else if (comfortableLoad != null) {
      patternLine = `De flesta dagar med ungefär ${Math.round(comfortableLoad)} saker blir som du tänkt dig.`;
    }
    const lowOrkHeavy = heavy.filter((h) => (h.ork10 ?? 10) <= 4).length;
    if (heavy.length >= 2 && lowOrkHeavy >= Math.ceil(heavy.length / 2)) {
      patternLine = `${patternLine ? patternLine + " " : ""}De tyngre dagarna började oftast med låg ork.`;
    }
  }

  return { days, todayLine, patternLine, comfortableLoad };
}
