import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/flow-items";

const STORAGE_KEY = "myflove-done-log";

type DoneLog = Record<string, string[]>;

/**
 * Genomförandestatus för saker som inte har någon egen "klar"-flagga –
 * t.ex. rutiner, lektioner och barnens schemarader.
 *
 * Loggen är dagsbaserad: en rutin som bockas av idag är öppen igen imorgon.
 * Detta är INTE ett parallellt check-off-system: uppgifter, påminnelser,
 * barnens aktiviteter och Quickflow-tankar använder fortfarande sin egen
 * status. Loggen fyller bara i luckorna.
 */
export function useDoneLog() {
  const [log, setLog] = useCloudSyncedStorage<DoneLog>(STORAGE_KEY, {});
  const day = todayISO();

  const isDone = useCallback((id: string) => (log?.[day] ?? []).includes(id), [log, day]);

  const toggleDone = useCallback(
    (id: string) => {
      setLog((prev) => {
        const current = prev?.[day] ?? [];
        const next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id];
        // Vi behåller bara de senaste dagarna – loggen ska inte växa i evighet.
        const keep = Object.keys(prev ?? {})
          .filter((d) => d >= dayMinus(day, 14))
          .reduce<DoneLog>((acc, d) => ({ ...acc, [d]: prev![d]! }), {});
        return { ...keep, [day]: next };
      });
    },
    [setLog, day],
  );

  return { isDone, toggleDone };
}

function dayMinus(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
