import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { DayEdges } from "@/lib/day-window";
import { dayCapacity } from "@/lib/day-capacity";
import { capacityWithActivityFeedback } from "@/lib/capacity-activity-feedback";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";

/** Enda källan för kalenderns kapacitet per dag (se dayCapacity). */
export function useDayCapacity() {
  const [edges] = useCloudSyncedStorage<DayEdges>("myflove-day-edges", {});
  const { energyEntries: logs } = useQuickCheckin();
  const { entries: factors } = useEnergyFlow();
  return useCallback((date: string) => {
    const baseline = dayCapacity(date, edges, logs);
    const morningTime = Date.parse(edges?.[date]?.morningLoggedAt ?? "");
    const latestLogTime = Math.max(...logs.filter(log => {
      const d = new Date(log.logged_at);
      return !Number.isNaN(d.getTime()) && [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-") === date;
    }).map(log => Date.parse(log.logged_at)), -Infinity);
    const latestManualAt = baseline.source === "morning" ? morningTime : latestLogTime;
    return capacityWithActivityFeedback(baseline, date, factors, Number.isFinite(latestManualAt) ? new Date(latestManualAt).toISOString() : null);
  }, [edges, logs, factors]);
}
