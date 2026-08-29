import { useCallback, useEffect } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/flow-items";

const STORAGE_KEY = "myflove-done-log";
/** Gammal, separat avbockning för rutiner på Hem. Migreras in i loggen. */
const LEGACY_ROUTINE_KEY = "myflove-routines-done";

type DoneLog = Record<string, string[]>;

/**
 * Genomförandestatus för saker som inte har någon egen "klar"-flagga –
 * t.ex. rutiner, lektioner och barnens schemarader.
 *
 * Loggen är dagsbaserad: en rutin som bockas av idag är öppen igen imorgon.
 * Detta är INTE ett parallellt check-off-system: uppgifter, påminnelser,
 * barnens aktiviteter och Quickflow-tankar använder fortfarande sin egen
 * status. Loggen fyller bara i luckorna.
 *
 * Rutiner bockas av här – och bara här. Tidigare fanns en egen lista
 * ("myflove-routines-done") för Hem-blocket, vilket gjorde att en avbockad
 * rutin kunde ligga kvar som "Nästa". Den listan migreras in en gång.
 */
export function useDoneLog(dayISO?: string) {
  const [log, setLog] = useCloudSyncedStorage<DoneLog>(STORAGE_KEY, {});
  const [legacyRoutines, setLegacyRoutines] = useCloudSyncedStorage<string[]>(
    LEGACY_ROUTINE_KEY,
    [],
  );
  // Loggen kan gälla vilken kalenderdag som helst – kalendern kan bocka av
  // saker på en annan dag än idag.
  const day = dayISO ?? todayISO();

  // Engångsmigrering: "2026-08-28:abc" blir dag 2026-08-28 + id "routine-abc".
  useEffect(() => {
    if (!legacyRoutines || legacyRoutines.length === 0) return;
    setLog((prev) => {
      const next: DoneLog = { ...(prev ?? {}) };
      for (const entry of legacyRoutines) {
        const sep = entry.indexOf(":");
        if (sep < 0) continue;
        const d = entry.slice(0, sep);
        const id = `routine-${entry.slice(sep + 1)}`;
        const current = next[d] ?? [];
        if (!current.includes(id)) next[d] = [...current, id];
      }
      return next;
    });
    setLegacyRoutines([]);
  }, [legacyRoutines, setLog, setLegacyRoutines]);

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
          .reduce<DoneLog>((acc, d) => ({ ...acc, [d]: prev?.[d] ?? [] }), {});
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
