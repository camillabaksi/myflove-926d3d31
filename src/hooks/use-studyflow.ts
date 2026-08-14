import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayKey, type WorkMeta } from "@/lib/workflow";

const META_KEY = "myflove-studyflow-meta";
const CHECK_KEY = "myflove-studyflow-endofday";
const SETTINGS_KEY = "myflove-studyflow-settings";

export interface StudyflowSettings {
  /** Klockslag då plugg-fönstret stängs (0–23). */
  endHour: number;
}

export function useStudyflow() {
  const [metaMap, setMetaMap] = useCloudSyncedStorage<Record<string, Partial<WorkMeta>>>(
    META_KEY,
    {},
  );
  const [checks, setChecks] = useCloudSyncedStorage<Record<string, string[]>>(CHECK_KEY, {});
  const [settings, setSettings] = useCloudSyncedStorage<StudyflowSettings>(SETTINGS_KEY, {
    endHour: 20,
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
          [key]: current.includes(label)
            ? current.filter((l) => l !== label)
            : [...current, label],
        };
      });
    },
    [setChecks],
  );

  return { metaMap, setMeta, dayChecks, toggleCheck, settings, setSettings };
}
