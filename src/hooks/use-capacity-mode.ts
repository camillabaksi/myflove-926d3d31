import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { todayISO } from "@/lib/day";
import { capacityFromPercent, type CapacityMode } from "@/lib/priority-engine";

interface Stored {
  date: string;
  mode: CapacityMode | null;
}

/**
 * Dagens kapacitetsläge. Användarens eget val gäller för dagen; annars
 * härleds läget tyst från det befintliga batteriet. Ingen procent visas.
 */
export function useCapacityMode() {
  const [stored, setStored] = useCloudSyncedStorage<Stored>("myflove-capacity-mode", {
    date: "",
    mode: null,
  });
  const { reading } = useEnergyBattery();
  const today = todayISO();
  const chosen = stored.date === today ? stored.mode : null;
  const mode: CapacityMode = chosen ?? capacityFromPercent(reading.now);

  const setMode = useCallback(
    (next: CapacityMode) => setStored({ date: todayISO(), mode: next }),
    [setStored],
  );

  return { mode, chosen: chosen != null, setMode, derived: capacityFromPercent(reading.now) };
}
