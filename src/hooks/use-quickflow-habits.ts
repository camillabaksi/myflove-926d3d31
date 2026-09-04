import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const STORAGE_KEY = "myflove-quickflow-habits";

/** Vad användaren brukar göra med sina Quickflow-saker – används bara för att föreslå. */
export type QuickflowAction = "paminn" | "kalender" | "klart" | "mapp" | "anteckning" | "bort";

export interface QuickflowHabits {
  actions: Partial<Record<QuickflowAction, number>>;
  folders: Record<string, number>;
}

const EMPTY: QuickflowHabits = { actions: {}, folders: {} };

export function useQuickflowHabits() {
  const [habits, setHabits] = useCloudSyncedStorage<QuickflowHabits>(STORAGE_KEY, EMPTY);

  const recordAction = useCallback(
    (action: QuickflowAction, folderId?: string) =>
      setHabits((prev) => {
        const base = prev ?? EMPTY;
        return {
          actions: { ...base.actions, [action]: (base.actions?.[action] ?? 0) + 1 },
          folders: folderId
            ? { ...base.folders, [folderId]: (base.folders?.[folderId] ?? 0) + 1 }
            : { ...base.folders },
        };
      }),
    [setHabits],
  );

  /** Den handling användaren oftast väljer – null tills det finns tillräckligt underlag. */
  const topAction = useMemo<QuickflowAction | null>(() => {
    const entries = Object.entries(habits?.actions ?? {}) as [QuickflowAction, number][];
    const best = entries.sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= 3 ? best[0] : null;
  }, [habits]);

  const topFolderId = useMemo<string | null>(() => {
    const entries = Object.entries(habits?.folders ?? {});
    const best = entries.sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= 2 ? best[0] : null;
  }, [habits]);

  return { habits: habits ?? EMPTY, recordAction, topAction, topFolderId };
}
