import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { InsightAreaId, InsightContext, StrategyNudge } from "@/lib/insight";

const STORAGE_KEY = "myflove-insight-strategies";

export interface SavedStrategy {
  id: string;
  strategyId: string;
  title: string;
  areaId: InsightAreaId;
  contexts: InsightContext[];
  friction: number;
  minutes: number;
  /** Konkreta påminnelser som användaren accepterat (kan vara tom). */
  nudges: StrategyNudge[];
  profileId?: string;
  /** Personal support or an explicitly fictional demo selection. Legacy items have no source. */
  source?: "personal" | "demo";
  addedAt: number;
}

const newId = () => Math.random().toString(36).slice(2, 11);

// TODO (framtida version): strategier ska kunna kopplas till en riktig profil
// först när samtycke, kryptering och radering finns på plats.
export function useInsightStrategies() {
  const [saved, setSaved] = useCloudSyncedStorage<SavedStrategy[]>(STORAGE_KEY, []);

  const addStrategy = useCallback(
    (input: Omit<SavedStrategy, "id" | "addedAt">) => {
      const item: SavedStrategy = { ...input, id: newId(), addedAt: Date.now() };
      setSaved((prev) => [item, ...prev.filter((s) => s.strategyId !== input.strategyId)]);
      return item;
    },
    [setSaved],
  );

  const removeStrategy = useCallback(
    (id: string) => setSaved((prev) => prev.filter((s) => s.id !== id)),
    [setSaved],
  );

  const hasStrategy = useCallback(
    (strategyId: string) => saved.some((s) => s.strategyId === strategyId),
    [saved],
  );

  return { saved, addStrategy, removeStrategy, hasStrategy };
}
