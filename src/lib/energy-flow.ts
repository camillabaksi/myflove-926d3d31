// Energiflöde™ – vad som ger och tar energi, som komplement till Energikartan.
// Energikartan säger "hur är min energi nu". Energiflödet säger "vad gjorde att
// den blev så". Rena funktioner här; laddning sker i use-energy-flow.

import type { FlowFactor } from "./flowscore";

export type EnergyDirection = "gives" | "drains";

export interface EnergyFactorEntry {
  id: string;
  title: string;
  direction: EnergyDirection;
  /** Hur mycket posten upplevs ge eller ta, 1–5. */
  strength: number;
  category: EnergyCategory;
  note: string | null;
  /** Om posten alls får påverka FlowScore. */
  countsTowardScore: boolean;
  occurredAt: string;
}

export interface EnergyPreset {
  id: string;
  title: string;
  direction: EnergyDirection;
  strength: number;
  category: EnergyCategory;
}

export type EnergyCategory =
  | "somn"
  | "socialt"
  | "rorelse"
  | "miljo"
  | "stress"
  | "aterhamtning"
  | "egentid"
  | "annat";

export const ENERGY_CATEGORIES: { id: EnergyCategory; label: string; emoji: string }[] = [
  { id: "somn", label: "Sömn", emoji: "😴" },
  { id: "socialt", label: "Socialt", emoji: "🫂" },
  { id: "rorelse", label: "Rörelse", emoji: "🚶" },
  { id: "miljo", label: "Ljud & miljö", emoji: "🔊" },
  { id: "stress", label: "Stress & konflikt", emoji: "🌪️" },
  { id: "aterhamtning", label: "Återhämtning", emoji: "🛋️" },
  { id: "egentid", label: "Egentid", emoji: "🌱" },
  { id: "annat", label: "Annat", emoji: "✨" },
];

export function categoryLabel(id: string): string {
  return ENERGY_CATEGORIES.find((c) => c.id === id)?.label ?? "Annat";
}

export function categoryEmoji(id: string): string {
  return ENERGY_CATEGORIES.find((c) => c.id === id)?.emoji ?? "✨";
}

/** Hur mycket energiflödet får påverka FlowScore. Användaren bestämmer. */
export type EnergyFlowWeight = "av" | "lite" | "normal" | "mycket";

export const WEIGHT_FACTOR: Record<EnergyFlowWeight, number> = {
  av: 0,
  lite: 0.5,
  normal: 1,
  mycket: 1.6,
};

export const WEIGHT_LABEL: Record<EnergyFlowWeight, string> = {
  av: "Av – påverkar inte alls",
  lite: "Lite",
  normal: "Normalt",
  mycket: "Mycket",
};

export interface EnergyFlowSettings {
  /** Huvudreglaget: av här betyder att energiflödet inte påverkar något alls. */
  enabled: boolean;
  weight: EnergyFlowWeight;
  /** Vikt per energifaktor (kategori) – går att ställa oberoende av varandra. */
  categoryWeights: Partial<Record<EnergyCategory, EnergyFlowWeight>>;
}

export const DEFAULT_ENERGY_FLOW_SETTINGS: EnergyFlowSettings = {
  enabled: true,
  weight: "normal",
  categoryWeights: {},
};

/** Läser in sparade inställningar och fyller på med standardvärden. */
export function normalizeSettings(
  raw: Partial<EnergyFlowSettings> | null | undefined,
): EnergyFlowSettings {
  return {
    enabled: raw?.enabled ?? true,
    weight: raw?.weight ?? "normal",
    categoryWeights: raw?.categoryWeights ?? {},
  };
}

export function categoryWeightFor(
  settings: EnergyFlowSettings,
  category: EnergyCategory,
): EnergyFlowWeight {
  return settings.categoryWeights?.[category] ?? "normal";
}

export function isSameDay(iso: string, day = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

export interface EnergyBalance {
  /** Summa av det som gav energi (positivt). */
  gives: number;
  /** Summa av det som tog energi (positivt tal). */
  drains: number;
  /** gives − drains. */
  net: number;
  /** Netto efter din egen vikt per energifaktor – det som faktiskt påverkar FlowScore. */
  weightedNet: number;
  count: number;
  topBoost?: string;
  topDrain?: string;
}

/** Dagens balans – bara poster som får räknas med. */
export function balanceFor(
  entries: EnergyFactorEntry[],
  day = new Date(),
  settings: EnergyFlowSettings = DEFAULT_ENERGY_FLOW_SETTINGS,
): EnergyBalance {
  const todays = entries.filter((e) => e.countsTowardScore && isSameDay(e.occurredAt, day));
  let gives = 0;
  let drains = 0;
  let weightedNet = 0;
  let topBoost: EnergyFactorEntry | undefined;
  let topDrain: EnergyFactorEntry | undefined;
  for (const e of todays) {
    const catFactor = WEIGHT_FACTOR[categoryWeightFor(settings, e.category)];
    if (e.direction === "gives") {
      gives += e.strength;
      weightedNet += e.strength * catFactor;
      if (!topBoost || e.strength > topBoost.strength) topBoost = e;
    } else {
      drains += e.strength;
      weightedNet -= e.strength * catFactor;
      if (!topDrain || e.strength > topDrain.strength) topDrain = e;
    }
  }
  return {
    gives,
    drains,
    net: gives - drains,
    weightedNet,
    count: todays.length,
    topBoost: topBoost?.title,
    topDrain: topDrain?.title,
  };
}

export interface EnergyFlowInput {
  net: number;
  topBoost?: string;
  topDrain?: string;
  count: number;
  weight: EnergyFlowWeight;
  /** Huvudreglaget. Av = ingen påverkan alls. */
  enabled?: boolean;
}

/**
 * Översätter dagens energibalans till en FlowScore-faktor.
 * Taket är medvetet lågt: energiflödet ska nyansera, inte kapa planen.
 */
export function energyFlowFactor(input: EnergyFlowInput): FlowFactor | null {
  if (input.enabled === false) return null;
  const multiplier = WEIGHT_FACTOR[input.weight];
  if (multiplier === 0 || input.count === 0) return null;
  const raw = input.net * 2.2 * multiplier;
  const delta = Math.round(Math.max(-16, Math.min(16, raw)));

  const reading =
    input.net === 0
      ? "Dagens poster tar ut varandra"
      : input.net > 0
        ? `Mer har gett än tagit idag${input.topBoost ? ` – t.ex. ${input.topBoost}` : ""}`
        : `Mer har tagit än gett idag${input.topDrain ? ` – t.ex. ${input.topDrain}` : ""}`;
  return {
    label: "Energiflöde idag",
    delta,
    source: "Energiflöde",
    reading,
    why:
      delta >= 0
        ? "Det du fyllt på med räknas med, så planen får vara lite mer generös."
        : "Sådant som tar energi räknas med, så planen blir rimlig i stället för för stor.",
  };
}

export interface EnergyTrendRow {
  key: string;
  label: string;
  emoji: string;
  gives: number;
  drains: number;
  net: number;
  count: number;
}

/** Mönster per kategori över en period – vad ger och vad tar oftast? */
export function categoryTrends(entries: EnergyFactorEntry[], days = 14): EnergyTrendRow[] {
  const since = Date.now() - days * 86400000;
  const map = new Map<string, EnergyTrendRow>();
  for (const e of entries) {
    if (new Date(e.occurredAt).getTime() < since) continue;
    const row = map.get(e.category) ?? {
      key: e.category,
      label: categoryLabel(e.category),
      emoji: categoryEmoji(e.category),
      gives: 0,
      drains: 0,
      net: 0,
      count: 0,
    };
    if (e.direction === "gives") row.gives += e.strength;
    else row.drains += e.strength;
    row.net = row.gives - row.drains;
    row.count += 1;
    map.set(e.category, row);
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

/** Mönster per titel – dina egna återkommande faktorer. */
export function titleTrends(entries: EnergyFactorEntry[], days = 30): EnergyTrendRow[] {
  const since = Date.now() - days * 86400000;
  const map = new Map<string, EnergyTrendRow>();
  for (const e of entries) {
    if (new Date(e.occurredAt).getTime() < since) continue;
    const key = `${e.title.toLowerCase()}|${e.direction}`;
    const row = map.get(key) ?? {
      key,
      label: e.title,
      emoji: e.direction === "gives" ? "🔋" : "🪫",
      gives: 0,
      drains: 0,
      net: 0,
      count: 0,
    };
    if (e.direction === "gives") row.gives += e.strength;
    else row.drains += e.strength;
    row.net = row.gives - row.drains;
    row.count += 1;
    map.set(key, row);
  }
  return Array.from(map.values())
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count || Math.abs(b.net) - Math.abs(a.net));
}

export interface EnergyInsight {
  /** Kort, icke-dömande mening som Flow kan använda rakt av. */
  message: string;
  /** Titeln som återkommer mest som dränare, om någon. */
  recurringDrain?: string;
  /** Om det är läge att erbjuda en lättare plan. */
  suggestLighterPlan: boolean;
}

/** Enkla mönster som Flow kan prata om – alltid som erbjudande, aldrig som dom. */
export function energyInsight(
  entries: EnergyFactorEntry[],
  todayBalance: EnergyBalance,
): EnergyInsight | null {
  const trends = titleTrends(entries, 30);
  const drains = trends.filter((t) => t.net < 0);
  const top = drains[0];
  if (!top && todayBalance.count === 0) return null;

  if (top && todayBalance.net < 0) {
    return {
      message: `Jag har märkt att ${top.label.toLowerCase()} ofta påverkar din kapacitet. Idag har mer tagit än gett energi – vill du att jag hjälper dig göra planen lättare?`,
      recurringDrain: top.label,
      suggestLighterPlan: true,
    };
  }
  if (todayBalance.net < -3) {
    return {
      message:
        "Dagen har tagit mer energi än den gett hittills. Det är helt okej – vill du att jag gör planen lättare?",
      suggestLighterPlan: true,
    };
  }
  const boosts = trends.filter((t) => t.net > 0);
  if (boosts[0]) {
    return {
      message: `${boosts[0].label} verkar ofta ge dig energi. Kanske något att lägga in idag om det finns utrymme.`,
      suggestLighterPlan: false,
    };
  }
  return null;
}
