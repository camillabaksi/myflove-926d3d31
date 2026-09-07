import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EveningAnswer } from "@/lib/day-journey";

export interface EveningEntry {
  day: string;
  answer: EveningAnswer;
  /** Ork 1–10 som var loggad när dagen summerades. */
  ork10?: number | null;
  planned?: number;
  done?: number;
  ts: number;
}

const KEY = "myflove-evening-check";
const HISTORY_KEY = "myflove-evening-check-history";
const HISTORY_DAYS = 120;

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Kvällscheck – "Hur blev dagen?". En rad per dag, kontosynkad via befintlig
 * user_kv-lagring. Helt frivillig och alltid möjlig att ändra.
 */
export function useEveningCheck() {
  const [entry, setEntry] = useCloudSyncedStorage<EveningEntry | null>(KEY, null);
  const [history, setHistory] = useCloudSyncedStorage<EveningEntry[]>(HISTORY_KEY, []);

  const today = useMemo(
    () => (entry && entry.day === todayKey() ? entry : null),
    [entry],
  );

  const logEvening = useCallback(
    (answer: EveningAnswer, context?: { ork10?: number | null; planned?: number; done?: number }) => {
      const day = todayKey();
      const next: EveningEntry = { day, answer, ...context, ts: Date.now() };
      setEntry(next);
      const cutoff = Date.now() - HISTORY_DAYS * 86_400_000;
      setHistory([...(history ?? []).filter((h) => h.day !== day && h.ts > cutoff), next]);
    },
    [setEntry, setHistory, history],
  );

  return { evening: today, eveningHistory: history ?? [], logEvening };
}
