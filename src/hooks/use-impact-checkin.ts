import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { normalizeImpactEntry, type ImpactDegree, type ImpactEntry, type ImpactKind } from "@/lib/impact-checkin";

const KEY = "myflove-impact-checkin";

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Dagens påverkan – en post per dag, kontosynkad via befintliga
 * user_kv-lagringen. Ingen ny tabell, ingen ny datakälla.
 * Påverkan ändrar aldrig batteriprocenten – den är enbart kontext.
 */
export function useImpactCheckin() {
  const [entry, setEntry] = useCloudSyncedStorage<ImpactEntry | null>(KEY, null);

  const today = useMemo<ImpactEntry | null>(() => {
    const normalized = normalizeImpactEntry(entry);
    return normalized && normalized.day === todayKey() ? normalized : null;
  }, [entry]);

  const logImpact = useCallback(
    (kinds: ImpactKind[], degree: ImpactDegree) => {
      setEntry({ day: todayKey(), kinds, degree, ts: Date.now() });
    },
    [setEntry],
  );

  return { impact: today, logImpact };
}
