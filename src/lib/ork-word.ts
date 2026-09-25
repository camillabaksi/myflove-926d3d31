import { CAPACITY_META, capacityFromPercent } from "./priority-engine";

/**
 * Ord för en nivå, med samma tre begrepp som kapacitetsläget:
 * 🟢 Fullt / 🟡 Mellan / 🔴 Lågt. Används för historik (t.ex. batterikurvan)
 * och för kompatibilitetssiffror härledda från kapacitetsläget.
 * OBS: styr aldrig aktuellt kapacitetsläge – det gör useCapacityMode.
 */
export interface OrkWord {
  /** "Fullt" | "Mellan" | "Lågt" */
  short: string;
  /** "🟢 Fullt" osv – ikon + text, aldrig bara färg. */
  label: string;
  text: string;
}

const TEXT = {
  lagt: "En sak i taget idag. Det viktigaste räcker.",
  mellan: "Du fungerar, men hushållar. Håll planen enkel.",
  fullt: "Det finns utrymme idag – utan att pressa in mer.",
} as const;

export function orkWord(percent: number): OrkWord {
  const mode = capacityFromPercent(percent);
  const meta = CAPACITY_META[mode];
  return { short: meta.label, label: `${meta.dot} ${meta.label}`, text: TEXT[mode] };
}
