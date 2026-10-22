import { strategiesForArea, type InsightStrategy } from "@/lib/insight";
import { areaForPersonalInsight, type PersonalInsight } from "@/lib/insight-personal";

/**
 * Offer at most one pre-existing, low-friction strategy related to the featured
 * observation. This is a choice to *view*, not permission to save a task.
 * Do not invent advice when the insight has no mapped area or support fits poorly.
 */
export function optionalSupportForInsight(
  insight: PersonalInsight | undefined,
  maxFriction: number,
): InsightStrategy | null {
  if (!insight || !Number.isFinite(maxFriction)) return null;
  const area = areaForPersonalInsight(insight.id);
  if (!area) return null;
  return strategiesForArea(area).find(strategy => strategy.friction <= maxFriction) ?? null;
}
