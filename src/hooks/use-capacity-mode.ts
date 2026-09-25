import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/day";
import { CAPACITY_PERCENT, type CapacityMode } from "@/lib/priority-engine";

interface Stored {
  /** Dagen då användaren senast valde läge. */
  date: string;
  mode: CapacityMode | null;
}

const VALID: CapacityMode[] = ["fullt", "mellan", "lagt"];
const CAPACITY_MINUTES: Record<CapacityMode, number> = { fullt: 240, mellan: 120, lagt: 45 };
const CAPACITY_TASKS: Record<CapacityMode, number> = { fullt: 5, mellan: 3, lagt: 1 };
export const DEFAULT_CAPACITY: CapacityMode = "mellan";

/** Läser sparat läge – okända/gamla värden ger null (→ standardläget). */
export function readCapacity(stored: Partial<Stored> | null | undefined): CapacityMode | null {
  const m = stored?.mode;
  return m && VALID.includes(m) ? m : null;
}

/**
 * ENDA källan för aktuellt kapacitetsläge: 🟢 Fullt / 🟡 Mellan / 🔴 Lågt.
 *
 * Användarens eget val gäller tills hen själv ändrar det. Batteri, FlowScore
 * och Energiflöde påverkar INTE läget – de finns kvar bara för historik och
 * insikter. Har användaren aldrig valt används Mellan.
 */
export function useCapacityMode() {
  const [stored, setStored] = useCloudSyncedStorage<Stored>("myflove-capacity-mode", {
    date: "",
    mode: null,
  });
  const chosen = readCapacity(stored);
  const mode: CapacityMode = chosen ?? DEFAULT_CAPACITY;

  const setMode = useCallback(
    (next: CapacityMode) => setStored({ date: todayISO(), mode: next }),
    [setStored],
  );

  return {
    mode,
    /** Har användaren själv valt ett läge (någon gång)? */
    chosen: chosen != null,
    /** Valdes läget idag? */
    chosenToday: chosen != null && stored?.date === todayISO(),
    setMode,
    /** Kompatibilitetssiffra härledd från läget – visas aldrig. */
    percent: CAPACITY_PERCENT[mode],
    /** Ungefärlig tid för krävande saker idag (kompatibilitet, visas aldrig). */
    minutes: CAPACITY_MINUTES[mode],
    /** Hur många saker planen gärna rymmer i läget. */
    suggestedTasks: CAPACITY_TASKS[mode],
  };
}
