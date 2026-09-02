import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { LifeArea } from "@/lib/life-areas";

export type ViewMode = "vanlig" | "forenklad";

type Store = Record<string, ViewMode>;
const DEFAULT_STORE: Store = {};

/**
 * Vanlig eller förenklad vy – valet sparas per rum (kategori)
 * och följer användaren mellan enheter.
 */
export function useViewMode(area: LifeArea | string) {
  const [store, setStore] = useCloudSyncedStorage<Store>("myflove-view-mode", DEFAULT_STORE);
  const mode = store[area] ?? "vanlig";

  const setMode = useCallback(
    (next: ViewMode) => setStore((current) => ({ ...current, [area]: next })),
    [area, setStore],
  );

  return { mode, setMode, isSimple: mode === "forenklad" };
}
