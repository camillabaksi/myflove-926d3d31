import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { DayEdges } from "@/lib/day-window";
import { dayCapacity } from "@/lib/day-capacity";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";

/** Enda källan för kalenderns kapacitet per dag (se dayCapacity). */
export function useDayCapacity() {
  const [edges] = useCloudSyncedStorage<DayEdges>("myflove-day-edges", {});
  const { energyEntries: logs } = useQuickCheckin();
  return useCallback((date: string) => dayCapacity(date, edges, logs), [edges, logs]);
}
