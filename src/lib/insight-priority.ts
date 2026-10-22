import type { PersonalInsight } from "@/lib/insight-personal";

const confidenceOrder = { vet: 0, ser: 1, "börjar": 2 } as const;

/** Prioritize stronger signals without discarding the original relative order. */
export function prioritizedInsights(insights: readonly PersonalInsight[]): PersonalInsight[] {
  return insights.map((insight, index) => ({ insight, index }))
    .sort((a, b) =>
      confidenceOrder[a.insight.confidence] - confidenceOrder[b.insight.confidence]
      || a.index - b.index)
    .map(({ insight }) => insight);
}

/** Plain-language confidence, never a diagnostic score or a promise of certainty. */
export function insightEvidenceLabel(confidence: PersonalInsight["confidence"]): string {
  if (confidence === "vet") return "Flera registreringar pekar åt samma håll";
  if (confidence === "ser") return "Ett möjligt mönster i dina registreringar";
  return "Tidig observation – behöver mer underlag";
}
