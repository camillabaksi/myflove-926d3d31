import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { TrainingProgram } from "@/lib/training.functions";
import { buildWeeklyPlan, weekStartKey, type WeekFeedback, type WeeklyPlan } from "@/lib/weekly-plan";
import { movementById } from "@/lib/everyday-movement";

export interface TrainingGoal {
  goal: string;
  focus: "styrka" | "kondition" | "blandat";
  daysPerWeek: number;
  minutesPerSession: number;
  level: "nybörjare" | "van" | "erfaren";
  equipment?: string;
  limitations?: string;
}

export interface TrainingState {
  goal: TrainingGoal | null;
  program: TrainingProgram | null;
  /** ISO-datum -> antal genomförda pass-index den dagen */
  done: Record<string, number[]>;
  /** ISO-datum -> steg */
  steps: Record<string, number>;
  stepGoal: number;
  /** ISO-datum -> id:n för vardagsmotion som gjorts */
  movement?: Record<string, string[]>;
  /** Mål för vardagsmotion i minuter per dag */
  movementGoal?: number;
  /** Aktuell veckoplan */
  weeklyPlan?: WeeklyPlan | null;
  /** veckostart (ISO-måndag) -> hur veckan kändes */
  weekFeedback?: Record<string, WeekFeedback>;
  createdAt?: number;
}

const DEFAULT_STATE: TrainingState = {
  goal: null,
  program: null,
  done: {},
  steps: {},
  stepGoal: 7000,
  movement: {},
  movementGoal: 20,
  weeklyPlan: null,
  weekFeedback: {},
};



export const todayKey = () => new Date().toISOString().slice(0, 10);

export function useTraining() {
  const [state, setState] = useCloudSyncedStorage<TrainingState>("myflove-training", DEFAULT_STATE);

  const saveProgram = useCallback(
    (goal: TrainingGoal, program: TrainingProgram) => {
      setState((prev) => ({
        ...prev,
        goal,
        program,
        createdAt: Date.now(),
        stepGoal: program.stepGoal ?? prev.stepGoal,
      }));
    },
    [setState],
  );

  const clearProgram = useCallback(() => {
    setState((prev) => ({ ...prev, program: null, goal: null }));
  }, [setState]);

  const toggleSessionDone = useCallback(
    (index: number, date = todayKey()) => {
      setState((prev) => {
        const current = prev.done[date] ?? [];
        const next = current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index];
        return { ...prev, done: { ...prev.done, [date]: next } };
      });
    },
    [setState],
  );

  const setSteps = useCallback(
    (count: number, date = todayKey()) => {
      setState((prev) => ({ ...prev, steps: { ...prev.steps, [date]: Math.max(0, Math.round(count)) } }));
    },
    [setState],
  );

  const setStepGoal = useCallback(
    (count: number) => setState((prev) => ({ ...prev, stepGoal: Math.max(1000, Math.round(count)) })),
    [setState],
  );

  const lastDays = useCallback(
    (days: number) => {
      const out: { date: string; steps: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({ date: key, steps: state.steps[key] ?? 0 });
      }
      return out;
    },
    [state.steps],
  );

  const toggleMovement = useCallback(
    (id: string, date = todayKey()) => {
      setState((prev) => {
        const current = prev.movement?.[date] ?? [];
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        return { ...prev, movement: { ...(prev.movement ?? {}), [date]: next } };
      });
    },
    [setState],
  );

  const setMovementGoal = useCallback(
    (minutes: number) => setState((prev) => ({ ...prev, movementGoal: Math.max(5, Math.round(minutes)) })),
    [setState],
  );

  const movementDays = useCallback(
    (days: number) => {
      const out: { date: string; ids: string[] }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({ date: key, ids: state.movement?.[key] ?? [] });
      }
      return out;
    },
    [state.movement],
  );

  return {
    state,
    saveProgram,
    clearProgram,
    toggleSessionDone,
    setSteps,
    setStepGoal,
    lastDays,
    toggleMovement,
    setMovementGoal,
    movementDays,
    movementToday: state.movement?.[todayKey()] ?? [],
    movementGoal: state.movementGoal ?? 20,
    doneToday: state.done[todayKey()] ?? [],
    stepsToday: state.steps[todayKey()] ?? 0,
  };

}
