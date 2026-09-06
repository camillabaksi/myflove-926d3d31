import { useCallback, useMemo } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useMoods } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import {
  expandInstances,
  fromTaskEnergy,
  moveInstance,
  completeInstance,
  recordEnergy,
  upsertRecord,
  type ActivityEnergy,
  type ActivityInstance,
  type ActivitySource,
  type InstanceRecord,
} from "@/lib/activity-history";
import { buildWeekReview, weekDates, type WeekReview } from "@/lib/week-review";

import { ACTIVITY_HISTORY_KEY } from "@/hooks/use-instance-status";

export { ACTIVITY_HISTORY_KEY };


/**
 * Historiken läser aktiviteterna där de redan bor (uppgifter och påminnelser)
 * och lägger bara till det som är unikt per dag: status, flytt och faktisk
 * energipåverkan. Ingen aktivitet dupliceras.
 */
export function useActivityHistory() {
  const { tasks } = useTasks();
  const { reminders } = useReminders();
  const [records, setRecords] = useCloudSyncedStorage<InstanceRecord[]>(ACTIVITY_HISTORY_KEY, []);

  const sources = useMemo<ActivitySource[]>(() => {
    const fromTasks: ActivitySource[] = tasks
      .filter((t) => !!t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        plannedDate: t.dueDate as string,
        startTime: t.time,
        endTime: t.endTime,
        completed: t.completed,
        completedAt: t.completedAt,
        expectedEnergy: fromTaskEnergy(t.energyImpact),
        actualEnergy: fromTaskEnergy(t.actualEnergy),
        kind: "uppgift",
      }));
    const fromReminders: ActivitySource[] = reminders.map((r) => ({
      id: `reminder-${r.id}`,
      title: r.title,
      plannedDate: r.date,
      startTime: r.time,
      endTime: r.endTime,
      repeat: r.repeat ?? "none",
      until: r.endDate,
      completed: r.completed,
      canceled: r.canceled,
      kind: "handelse",
    }));
    return [...fromTasks, ...fromReminders];
  }, [tasks, reminders]);

  const instancesBetween = useCallback(
    (from: string, to: string): ActivityInstance[] => expandInstances(sources, records, from, to),
    [sources, records],
  );

  const setEnergy = useCallback(
    (sourceId: string, date: string, energy: ActivityEnergy) => {
      setRecords((prev) => recordEnergy(prev, sourceId, date, energy));
    },
    [setRecords],
  );

  const setExpectedEnergy = useCallback(
    (sourceId: string, date: string, energy: ActivityEnergy) => {
      setRecords((prev) => upsertRecord(prev, sourceId, date, { expectedEnergy: energy }));
    },
    [setRecords],
  );

  const complete = useCallback(
    (sourceId: string, date: string) => {
      setRecords((prev) => completeInstance(prev, sourceId, date));
    },
    [setRecords],
  );

  const move = useCallback(
    (sourceId: string, fromDate: string, toDate: string) => {
      setRecords((prev) => moveInstance(prev, sourceId, fromDate, toDate));
    },
    [setRecords],
  );

  const cancel = useCallback(
    (sourceId: string, date: string) => {
      setRecords((prev) => upsertRecord(prev, sourceId, date, { status: "installd" }));
    },
    [setRecords],
  );

  return { records, instancesBetween, setEnergy, setExpectedEnergy, complete, move, cancel };
}

/** 💜 Din vecka – sammanfattning byggd på historikens faktiska data. */
export function useWeekReview(weekStart: string): WeekReview {
  const { instancesBetween } = useActivityHistory();
  const { moods } = useMoods();
  const { items } = useQuickflow();
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);

  return useMemo(() => {
    const days = weekDates(weekStart);
    const instances = instancesBetween(days[0]!, days[6]!);
    return buildWeekReview({
      weekStart,
      instances,
      energy: energyLog.map((e) => ({ level: e.level, loggedAt: e.logged_at })),
      moods: moods.map((m) => ({ score: m.score, date: m.date })),
      quickflowDone: items.filter((i) => i.done).map((i) => ({ doneAt: i.doneAt })),
    });
  }, [weekStart, instancesBetween, energyLog, moods, items]);
}
