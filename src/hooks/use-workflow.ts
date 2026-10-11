import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { todayKey, type WorkMeta } from "@/lib/workflow";

const META_KEY = "myflove-workflow-meta";
const CHECK_KEY = "myflove-workflow-endofday";
const SETTINGS_KEY = "myflove-workflow-settings";

export interface WorkflowSettings {
  /** Klockslag då arbetsdagen slutar (0–23). */
  endHour: number;
}

export function useWorkflow() {
  const [metaMap, setMetaMap] = useCloudSyncedStorage<Record<string, Partial<WorkMeta>>>(
    META_KEY,
    {},
  );
  const [checks, setChecks] = useCloudSyncedStorage<Record<string, string[]>>(CHECK_KEY, {});
  const [settings, setSettings] = useCloudSyncedStorage<WorkflowSettings>(SETTINGS_KEY, {
    endHour: 17,
  });

  const setMeta = useCallback(
    (taskId: string, patch: Partial<WorkMeta>) => {
      setMetaMap((prev) => ({ ...prev, [taskId]: { ...(prev[taskId] ?? {}), ...patch } }));
    },
    [setMetaMap],
  );

  const dayChecks = checks[todayKey()] ?? [];

  const toggleCheck = useCallback(
    (label: string) => {
      const key = todayKey();
      setChecks((prev) => {
        const current = prev[key] ?? [];
        return {
          ...prev,
          [key]: current.includes(label) ? current.filter((l) => l !== label) : [...current, label],
        };
      });
    },
    [setChecks],
  );

  return { metaMap, setMeta, dayChecks, toggleCheck, settings, setSettings };
}

/** Samma kontobundna och reaktiva energiloggar som incheckningen. Ingen logg idag ger null. */
export function useLatestEnergy() {
  const { todayEnergy } = useQuickCheckin();
  return todayEnergy?.level ?? null;
}
