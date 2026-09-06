import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { normalizeImpactEntry, type ImpactDegree, type ImpactEntry, type ImpactKind } from "@/lib/impact-checkin";

const KEY = "myflove-impact-checkin";
const HISTORY_KEY = "myflove-impact-history";
const HISTORY_DAYS = 90;

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Dagens påverkan – en post per dag, kontosynkad via befintliga
 * user_kv-lagringen. Ingen ny tabell, ingen ny datakälla.
 * Påverkan ändrar aldrig batteriprocenten – den är enbart kontext.
 * Historiken används bara för användarens egna mönster.
 */
export function useImpactCheckin() {
  const [entry, setEntry] = useCloudSyncedStorage<ImpactEntry | null>(KEY, null);
  const [history, setHistory] = useCloudSyncedStorage<ImpactEntry[]>(HISTORY_KEY, []);

  const today = useMemo<ImpactEntry | null>(() => {
    const normalized = normalizeImpactEntry(entry);
    return normalized && normalized.day === todayKey() ? normalized : null;
  }, [entry]);

  const logImpact = useCallback(
    (kinds: ImpactKind[], degree: ImpactDegree) => {
      const day = todayKey();
      const next: ImpactEntry = { day, kinds, degree, ts: Date.now() };
      setEntry(next);
      const cutoff = Date.now() - HISTORY_DAYS * 86_400_000;
      setHistory([
        ...(history ?? []).filter((h) => h.day !== day && h.ts > cutoff),
        next,
      ]);
    },
    [setEntry, setHistory, history],
  );

  const clearImpact = useCallback(() => {
    const day = todayKey();
    setEntry(null);
    setHistory((history ?? []).filter((h) => h.day !== day));
  }, [setEntry, setHistory, history]);

  return { impact: today, impactHistory: history ?? [], logImpact, clearImpact };
}
