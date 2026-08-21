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
export function useDoneLog(dayISO?: string) {
  const [log, setLog] = useCloudSyncedStorage<DoneLog>(STORAGE_KEY, {});
  // Loggen kan gälla vilken kalenderdag som helst – kalendern kan bocka av
  // saker på en annan dag än idag.
  const day = dayISO ?? todayISO();

  const isDone = useCallback((id: string) => (log?.[day] ?? []).includes(id), [log, day]);

  const toggleDone = useCallback(
    (id: string) => {
      setLog((prev) => {
        const current = prev?.[day] ?? [];
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        // Vi behåller bara de senaste dagarna – loggen ska inte växa i evighet.
        // Rensa gamla dagar, men aldrig den dag vi just nu skriver till.
        const cutoff = dayMinus(todayISO(), 14);
        const keep = Object.keys(prev ?? {})
          .filter((d) => d >= cutoff || d === day)
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
