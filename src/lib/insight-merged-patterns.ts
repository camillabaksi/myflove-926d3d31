import type { PersonalInsight } from "@/lib/insight-personal";
import type { EverydayPatterns } from "@/lib/everyday-patterns";

export interface MergedInsightPattern {
  id: string;
  text: string;
  context: string;
}

/** Personal observations and calendar patterns share a single optional list.
 * Planned activity counts must never be presented as proven completion or
 * a cause of an energy change. Energy causation belongs to logged factors. */
export function mergedInsightPatterns(
  otherInsights: readonly PersonalInsight[],
  patterns: Pick<EverydayPatterns, "busiest" | "calmest">,
  evidenceLabel: (confidence: PersonalInsight["confidence"]) => string,
): MergedInsightPattern[] {
  const items: MergedInsightPattern[] = otherInsights.map((insight) => ({
    id: `observed-${insight.id}`,
    text: insight.text,
    context: evidenceLabel(insight.confidence),
  }));

  if (patterns.busiest) {
    items.push({
      id: "planned-busiest",
      text: `Bland dina planerade aktiviteter verkar ${patterns.busiest.label} oftast vara fullast, med ungefär ${patterns.busiest.average.toFixed(1)} saker per dag.`,
      context: "Planerade aktiviteter – inte bekräftat genomförande",
    });
  }
  if (patterns.calmest && patterns.calmest.weekday !== patterns.busiest?.weekday) {
    items.push({
      id: "planned-calmest",
      text: `Bland dina planerade aktiviteter verkar ${patterns.calmest.label} ha lite färre inbokade saker.`,
      context: "Planerade aktiviteter – inte ett mått på återhämtning",
    });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.text.trim().toLocaleLowerCase("sv-SE").replace(/\s+/g, " ");
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
