import { useMemo } from "react";
import { useMoods, useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useWorkflow, useLatestEnergy } from "@/hooks/use-workflow";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useFlowReset } from "@/hooks/use-daily-flow";
import { useTraining } from "@/hooks/use-training";

import { bookedTimeLeft, type BookedSlot } from "@/lib/booked-time";
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
  const { expectation } = useEnergyPattern();
  const { lectures } = useStudySchedule();

  const mood = useMemo(() => {
    if (!moods.length) return null;
    const latest = [...moods].sort((a, b) => b.date - a.date)[0];
    return latest ? latest.score : null;
  }, [moods]);

  const minutesLeft = useMemo(
    () => minutesLeftOfWorkday(settings.endHour),
    [settings.endHour],
  );

  // Bokad tid idag: uppgifter med klockslag + dagens lektioner.
  const booked = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekday = (new Date().getDay() + 6) % 7;
    const slots: BookedSlot[] = [
      ...tasks
        .filter((t) => !t.completed && t.time && (!t.dueDate || t.dueDate === today))
        .map((t) => ({ start: t.time as string, end: t.endTime ?? "", title: t.title })),
      ...lectures
        .filter((l) => l.weekday === weekday)
        .map((l) => ({ start: l.start, end: l.end, title: l.title })),
    ];
    return bookedTimeLeft(slots, { endHour: settings.endHour });
  }, [tasks, lectures, settings.endHour]);

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
      bookedMinutes: booked.minutesLeftBooked,
      nextEvent: booked.nextTitle
        ? { title: booked.nextTitle, start: booked.nextStart ?? "" }
        : null,
      energyPattern: expectation,
    });
  }, [tasks, energy, mood, openItems.length, minutesLeft, booked, expectation]);

  return { flow, energy, mood, minutesLeft };
}

