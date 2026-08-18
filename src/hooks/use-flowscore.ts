import { useMemo } from "react";
import { useMoods, useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useWorkflow, useLatestEnergy } from "@/hooks/use-workflow";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useFlowReset } from "@/hooks/use-daily-flow";
import { useTraining } from "@/hooks/use-training";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { energyFlowFactor } from "@/lib/energy-flow";

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
  const { entries: resetEntries } = useFlowReset();
  const { doneToday: sessionsDone, stepsToday } = useTraining();
  // Energiflöde™: det användaren själv registrerat som ger/tar energi idag.
  const { balance: energyBalance, settings: energyFlowSettings } = useEnergyFlow();

  // Gårdagens Flow Reset – används som startläge för dagen.
  const yesterdayFeel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().slice(0, 10);
    return resetEntries.find((e) => e.date === iso)?.feel ?? null;
  }, [resetEntries]);


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

  const energyFlow = useMemo(
    () =>
      energyFlowFactor({
        net: energyBalance.weightedNet,
        topBoost: energyBalance.topBoost,
        topDrain: energyBalance.topDrain,
        count: energyBalance.count,
        weight: energyFlowSettings.weight,
        enabled: energyFlowSettings.enabled,
      }),
    [energyBalance, energyFlowSettings.weight, energyFlowSettings.enabled],
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
      bookedMinutes: booked.minutesLeftBooked,
      nextEvent: booked.nextTitle
        ? { title: booked.nextTitle, start: booked.nextStart ?? "" }
        : null,
      energyPattern: expectation,
      yesterdayFeel,
      movementToday: { steps: stepsToday, sessions: sessionsDone.length },
      energyFlow,
    });
  }, [
    tasks,
    energy,
    mood,
    openItems.length,
    minutesLeft,
    booked,
    expectation,
    yesterdayFeel,
    stepsToday,
    sessionsDone.length,
    energyFlow,
  ]);


  return { flow, energy, mood, minutesLeft };
}

