import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/flow-items";

/**
 * "Planera min dag" – den ordning användaren valt för dagen.
 * Planen är bara en ordning på saker som redan finns i den gemensamma
 * aktivitetsmodellen (uppgifter). Inga nya aktiviteter skapas här.
 */
export interface DayPlanStep {
  taskId: string;
  title: string;
  estimatedMin: number;
  why: string;
}

export interface DayPlan {
  /** ISO-datum planen gäller. En plan lever bara sin dag ut. */
  day: string;
  intro: string;
  note: string;
  steps: DayPlanStep[];
}

const STORAGE_KEY = "myflove-day-plan";

export function useDayPlan() {
  const [stored, setStored] = useCloudSyncedStorage<DayPlan | null>(STORAGE_KEY, null);
  const day = todayISO();
  const plan = stored && stored.day === day ? stored : null;

  const save = useCallback(
    (p: Omit<DayPlan, "day">) => setStored({ ...p, day: todayISO() }),
    [setStored],
  );
  const clear = useCallback(() => setStored(null), [setStored]);

  return { plan, save, clear };
}
