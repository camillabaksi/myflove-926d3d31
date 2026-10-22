// MyFlove Insight – personlig vy.
//
// Här härleds användarens EGNA insikter ur data som redan finns i appen
// (Flows lärande: avklarade uppgifter, öppna uppgifter, energiloggar, aktiva dagar).
// Inga påhittade slutsatser: saknas underlag returneras `ready: false` och
// vyn visar ett lugnt tomläge istället.

import type { FlowKnowledge } from "@/lib/flow-learning";
import type { InsightAreaId } from "@/lib/insight";

export interface PersonalSignals {
  /** Antal dagar användaren varit aktiv i appen. */
  activeDays: number;
  /** Antal avklarade uppgifter vi känner till. */
  completedCount: number;
  /** Antal energiloggar. */
  energyCount: number;
}

export interface PersonalInsight {
  id: string;
  text: string;
  confidence: FlowKnowledge["insights"][number]["confidence"];
}

export interface PersonalInsightView {
  /** Finns tillräckligt underlag för att visa personliga insikter? */
  ready: boolean;
  level: number;
  label: string;
  insights: PersonalInsight[];
  /** Behovsområden som insikterna pekar mot – ger relevanta strategiförslag. */
  areas: InsightAreaId[];
}

/** Insikts-id från flow-learning → behovsområde i Insight. */
const AREA_FOR_INSIGHT: Record<string, InsightAreaId> = {
  mornings: "tid",
  evenings: "tid",
  midday: "tid",
  "heavy-day": "energi",
  postponed: "exekutiva",
  "energy-dip": "energi",
  energy: "energi",
  people: "kommunikation",
};

/** Reuse the same evidence-to-support-area mapping throughout Insights.
 * Unknown signals must not be assigned a guessed need or strategy. */
export function areaForPersonalInsight(id: string): InsightAreaId | undefined {
  return AREA_FOR_INSIGHT[id];
}

/** Insikter som inte är riktiga observationer utan bara en uppstartshälsning. */
const PLACEHOLDER_IDS = new Set(["start"]);

/** Minsta underlag innan vi vågar säga något om användaren. */
export function hasEnoughData(signals: PersonalSignals): boolean {
  return signals.activeDays >= 3 || signals.completedCount >= 5 || signals.energyCount >= 3;
}

export function buildPersonalInsight(
  knowledge: FlowKnowledge,
  signals: PersonalSignals,
): PersonalInsightView {
  const real = knowledge.insights.filter((i) => !PLACEHOLDER_IDS.has(i.id));
  const ready = real.length > 0 && hasEnoughData(signals);

  const areas: InsightAreaId[] = [];
  if (ready) {
    for (const i of real) {
      const area = areaForPersonalInsight(i.id);
      if (area && !areas.includes(area)) areas.push(area);
    }
  }

  return {
    ready,
    level: knowledge.level,
    label: knowledge.label,
    insights: ready ? real.map((i) => ({ id: i.id, text: i.text, confidence: i.confidence })) : [],
    areas,
  };
}

/** Exempel på vad Flow kan komma att se – tydligt märkta som exempel, inte slutsatser. */
export const INSIGHT_EXAMPLES: string[] = [
  "Vilka tider på dygnet som saker faktiskt brukar bli av för dig.",
  "Vilka veckodagar som brukar bli tyngre än andra.",
  "Vilka uppgifter som ofta blir liggande – och kan behöva delas upp.",
  "Hur din energi rör sig över dagen, så att inget tungt hamnar i en dipp.",
];
