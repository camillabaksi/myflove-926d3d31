import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/flow-items";
import type { ReplanMode } from "@/lib/replan";

interface Stored {
  date: string;
  mode: ReplanMode;
}

/**
 * Dagens omplaneringsläge. Valet gäller resten av dagen och nollställs
 * automatiskt till imorgon – ingen ska vakna i ett läge de glömt att de valt.
 */
export function useReplanMode(): {
  mode: ReplanMode;
  chosen: boolean;
  setMode: (mode: ReplanMode) => void;
} {
  const [stored, setStored] = useCloudSyncedStorage<Stored | null>("myflove-replan-mode", null);
  const today = todayISO();
  const valid = stored && stored.date === today ? stored : null;

  const setMode = useCallback(
    (mode: ReplanMode) => setStored({ date: todayISO(), mode }),
    [setStored],
  );

  return useMemo(
    () => ({ mode: valid?.mode ?? "vanlig", chosen: !!valid, setMode }),
    [valid, setMode],
  );
}
