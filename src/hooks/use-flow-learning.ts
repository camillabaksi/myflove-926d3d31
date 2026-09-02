import { useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useChildren } from "@/hooks/use-children";
import { useVisitStreak } from "@/hooks/use-visit-streak";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { analyzeFlow, type FlowKnowledge } from "@/lib/flow-learning";


interface StoredEnergy {
  id: string;
  level: number;
  logged_at: string;
}

/**
 * Vad Flow har lärt sig om användaren.
 * Använder enbart data som redan finns i MyFlove – inget nytt samlas in.
 */
export function useFlowLearning(): FlowKnowledge {
  const { activeTasks, completedTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { children } = useChildren();
  const { totalDays } = useVisitStreak();
  const [energyLog] = useCloudSyncedStorage<StoredEnergy[]>("myflove-energy-log", []);

  return useMemo(
    () =>
      analyzeFlow({
        completed: completedTasks.map((t) => ({
          completedAt: t.completedAt,
          time: t.time,
          title: t.title,
        })),
        open: [
          ...activeTasks.map((t) => ({
            createdAt: t.createdAt,
            dueDate: t.dueDate,
            snoozedUntil: t.snoozedUntil,
            title: t.title,
          })),
          ...activeReminders.map((r) => ({
            createdAt: r.createdAt,
            dueDate: r.date,
            title: r.title,
          })),
        ],
        energy: (energyLog ?? []).map((e) => ({
          level: e.level <= 5 ? e.level * 20 : e.level,
          at: new Date(e.logged_at).getTime(),
        })),
        activeDays: totalDays,
        people: children?.length ?? 0,
      }),
    [completedTasks, activeTasks, activeReminders, energyLog, totalDays, children],
  );
}
