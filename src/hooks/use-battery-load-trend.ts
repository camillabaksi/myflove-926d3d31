import { useMemo } from "react";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { buildBatteryLoadTrend } from "@/lib/battery-load-trend";

const DAY_MS = 86_400_000;

const localDay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useBatteryLoadTrend() {
  const { instancesBetween } = useActivityHistory();
  const [energy] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);

  return useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 13 * DAY_MS);
    return buildBatteryLoadTrend({
      energy: energy ?? [],
      instances: instancesBetween(localDay(from), localDay(now)),
      now,
    });
  }, [energy, instancesBetween]);
}
