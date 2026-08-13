import { useMemo } from "react";
import { useMoods, useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useWorkflow, useLatestEnergy } from "@/hooks/use-workflow";
import { computeFlowScore, type FlowScore } from "@/lib/flowscore";
import { minutesLeftOfWorkday } from "@/lib/workflow";

function isToday(ts?: number) {
  if (!ts) return false;
  const d = new Date(ts);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

/** FlowScore™ – vad är rimligt för mig just nu? */
export function useFlowScore(): {
  flow: FlowScore;
  energy: number | null;
  mood: number | null;
  minutesLeft: number;
} {
  const { tasks } = useTasks();
  const { moods } = useMoods();
  const { openItems } = useQuickflow();
  const { settings } = useWorkflow();
  const energy = useLatestEnergy();

  const mood = useMemo(() => {
    if (!moods.length) return null;
    const latest = [...moods].sort((a, b) => b.date - a.date)[0];
    return latest ? latest.score : null;
  }, [moods]);

  const minutesLeft = useMemo(
    () => minutesLeftOfWorkday(settings.endHour),
    [settings.endHour],
  );

  const flow = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate < today,
    ).length;
    const doneToday = tasks.filter((t) => t.completed && isToday(t.completedAt)).length;
    return computeFlowScore({
      energy,
      mood,
      minutesLeft,
      openThoughts: openItems.length,
      overdue,
      doneToday,
    });
  }, [tasks, energy, mood, openItems.length, minutesLeft]);

  return { flow, energy, mood, minutesLeft };
}

