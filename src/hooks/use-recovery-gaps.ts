import { useCallback, useMemo } from "react";

import { useTasks } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import { useDayWindow } from "@/hooks/use-day-window";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import {
  buildRecoveryGaps,
  recoveryEndTime,
  recoveryTaskTitle,
  type FixedSlot,
  type RecoveryGap,
  type RecoveryGapsResult,
  type RecoveryOption,
} from "@/lib/recovery-gaps";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * "Om vi inte kan ändra dagen – var kan vi skapa lite mer återhämtning?"
 *
 * Samlar dagens redan befintliga hållpunkter (uppgifter med tid, lektioner,
 * barnens schema) och dagens kapacitet från FlowScore™. Ingen ny lagring,
 * inget nytt batteri och inget bokas utan att användaren säger ja.
 */
export function useRecoveryGaps(opts?: { includeFamily?: boolean }): {
  result: RecoveryGapsResult;
  /** Sparar den valda återhämtningen som en vanlig uppgift idag. */
  accept: (gap: RecoveryGap, option: RecoveryOption) => { created: boolean; title: string };
} {
  const includeFamily = opts?.includeFamily ?? true;
  const { tasks, addTask } = useTasks();
  const { lectures } = useStudySchedule();
  const childEvents = useChildEvents();
  const { window } = useDayWindow();
  const { flow } = useFlowScore();
  const { balance } = useEnergyFlow();

  const today = todayISO();

  const slots = useMemo<FixedSlot[]>(() => {
    const weekday = (new Date(`${today}T00:00:00`).getDay() + 6) % 7;
    const out: FixedSlot[] = [
      ...tasks
        .filter((t) => !t.completed && t.time && (!t.dueDate || t.dueDate === today))
        .map((t) => ({ start: t.time as string, end: t.endTime, title: t.title, who: "jag" as const })),
      ...lectures
        .filter((l) => l.weekday === weekday)
        .map((l) => ({ start: l.start, end: l.end, title: l.title, who: "jag" as const })),
    ];
    if (includeFamily) {
      for (const e of childEvents) {
        if (e.completed) continue;
        out.push({ start: e.time, title: e.title, who: "familj" });
      }
    }
    return out;
  }, [tasks, lectures, childEvents, includeFamily, today]);

  const result = useMemo(() => {
    const now = new Date();
    return buildRecoveryGaps({
      slots,
      score: typeof flow?.score === "number" ? flow.score : null,
      dayStart: window?.start,
      dayEnd: window?.end,
      nowMinutes: now.getHours() * 60 + now.getMinutes(),
      energyBoostTitle: balance?.topBoost ?? null,
    });
  }, [slots, flow?.score, window?.start, window?.end, balance?.topBoost]);

  const accept = useCallback(
    (gap: RecoveryGap, option: RecoveryOption) => {
      const title = recoveryTaskTitle(option);
      const time = gap.start;
      // Dubblettskydd: samma tid och titel skapas aldrig två gånger.
      const exists = tasks.some(
        (t) => !t.completed && t.dueDate === today && t.time === time && t.title === title,
      );
      if (exists) return { created: false, title };
      addTask(title, today, {
        time,
        endTime: recoveryEndTime(gap, option),
        area: "halsa",
        note: "Återhämtning som du själv valde.",
      });
      return { created: true, title };
    },
    [tasks, addTask, today],
  );

  return { result, accept };
}
