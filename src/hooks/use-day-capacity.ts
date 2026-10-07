import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { DayEdges } from "@/lib/day-window";
import { dayCapacity, type EnergyLogEntry } from "@/lib/day-capacity";

/** Enda källan för kalenderns kapacitet per dag (se dayCapacity). */
export function useDayCapacity() {
  const [edges] = useCloudSyncedStorage<DayEdges>("myflove-day-edges", {});
  const [logs] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);
  return useCallback((date: string) => dayCapacity(date, edges, logs), [edges, logs]);
}
