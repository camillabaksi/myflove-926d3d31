/**
 * Adaptiv personalisering – MyFlove lär sig av faktisk användning.
 *
 * Principen: ALLA börjar från samma neutrala grund (Quickflow → Batteriet →
 * Kalendern). Inga antaganden om familj, diagnos, mående eller livssituation.
 * Först när användaren faktiskt använt appen tillräckligt många gånger
 * börjar ordningen anpassas efter vad hen själv använder mest.
 *
 * Datat är enkla räknare i befintlig molnsynkad lagring – ingen ny datamodell.
 */

import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

export type FeatureId = "quickflow" | "batteri" | "kalender";

/** Gemensam grund för alla nya användare. */
export const DEFAULT_FEATURE_ORDER: FeatureId[] = ["quickflow", "batteri", "kalender"];

/** Så många signaler krävs innan vi ändrar något åt användaren. */
export const ADAPT_THRESHOLD = 8;

export type FeatureUsage = Partial<Record<FeatureId, number>>;

export const FEATURE_USAGE_KEY = "myflove-feature-usage";

export function totalUses(usage: FeatureUsage): number {
  return DEFAULT_FEATURE_ORDER.reduce((sum, id) => sum + (usage[id] ?? 0), 0);
}

/** Sant först när vi har tillräckligt med egen data för att våga anpassa. */
export function hasEnoughSignals(usage: FeatureUsage): boolean {
  return totalUses(usage) >= ADAPT_THRESHOLD;
}

/**
 * Ordningen på startsidans tre huvudkort.
 * Under tröskeln: exakt samma grundordning för alla.
 * Över tröskeln: mest använt först, med grundordningen som stabil tiebreak.
 */
export function featureOrder(usage: FeatureUsage): FeatureId[] {
  if (!hasEnoughSignals(usage)) return [...DEFAULT_FEATURE_ORDER];
  return [...DEFAULT_FEATURE_ORDER].sort((a, b) => {
    const diff = (usage[b] ?? 0) - (usage[a] ?? 0);
    if (diff !== 0) return diff;
    return DEFAULT_FEATURE_ORDER.indexOf(a) - DEFAULT_FEATURE_ORDER.indexOf(b);
  });
}

/** Den funktion användaren använder mest – null tills vi vet nog. */
export function topFeature(usage: FeatureUsage): FeatureId | null {
  if (!hasEnoughSignals(usage)) return null;
  return featureOrder(usage)[0] ?? null;
}

export function recordUse(usage: FeatureUsage, id: FeatureId): FeatureUsage {
  return { ...usage, [id]: (usage[id] ?? 0) + 1 };
}

export function useFeatureUsage() {
  const [usage, setUsage] = useCloudSyncedStorage<FeatureUsage>(FEATURE_USAGE_KEY, {});
  const record = useCallback(
    (id: FeatureId) => setUsage((prev) => recordUse(prev ?? {}, id)),
    [setUsage],
  );
  const safe = usage ?? {};
  return {
    usage: safe,
    record,
    order: featureOrder(safe),
    adaptive: hasEnoughSignals(safe),
    top: topFeature(safe),
  };
}
