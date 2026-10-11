import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { TrainingProgram } from "@/lib/training.functions";

export type TrainingSession = TrainingProgram["sessions"][number];
import {
  buildWeeklyPlan,
  weekStartKey,
  type WeekFeedback,
  type WeeklyPlan,
} from "@/lib/weekly-plan";
import { movementById } from "@/lib/everyday-movement";

export interface TrainingGoal {
  goal: string;
  focus: "styrka" | "kondition" | "blandat" | "viktnedgång";
  daysPerWeek: number;
  minutesPerSession: number;
  level: "nybörjare" | "van" | "erfaren";
  /** Valda veckodagar för passen, t.ex. ["Måndag","Torsdag"] */
  days?: string[];
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
  /** ISO-datum -> vikt i kg */
  weights?: Record<string, number>;
  /** ISO-datum -> notering till viktmätningen */
  weightNotes?: Record<string, string>;
  /** Målvikt i kg */
  weightGoal?: number | null;
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
  weights: {},
  weightNotes: {},
  weightGoal: null,
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
        // Completion indices from the replaced program cannot mark new passes done.
        done: Object.fromEntries(Object.entries(prev.done).filter(([date]) => date !== todayKey())),
        stepGoal: program.stepGoal ?? prev.stepGoal,
      }));
    },
    [setState],
  );

  const updateSession = useCallback(
    (index: number, patch: Partial<TrainingSession>) => {
      setState((prev) => {
        if (!prev.program) return prev;
        const sessions = prev.program.sessions.map((s, i) =>
          i === index ? { ...s, ...patch } : s,
        );
        return { ...prev, program: { ...prev.program, sessions } };
      });
    },
    [setState],
  );

  const addSessions = useCallback(
    (added: TrainingSession[]) => {
      if (!added.length) return;
      setState((prev) => {
        const first = added[0]!;
        return {
          ...prev,
          goal: prev.goal ?? {
            goal: "Mitt eget träningsprogram",
            focus: first.type === "styrka" || first.type === "kondition" ? first.type : "blandat",
            daysPerWeek: new Set(added.map((session) => session.day)).size,
            days: [...new Set(added.map((session) => session.day))],
            minutesPerSession: first.minutes ?? 30,
            level: "nybörjare",
          },
          program: {
            ...(prev.program ?? { intro: "Ditt program, i din takt.", note: "Ändra passen när du vill." }),
            sessions: [...(prev.program?.sessions ?? []), ...added],
          },
        };
      });
    },
    [setState],
  );

  const addSession = useCallback((session: TrainingSession) => addSessions([session]), [addSessions]);

  const removeSession = useCallback(
    (index: number) => {
      setState((prev) => {
        if (!prev.program) return prev;
        const sessions = prev.program.sessions.filter((_, i) => i !== index);
        const done: Record<string, number[]> = {};
        for (const [date, list] of Object.entries(prev.done)) {
          done[date] = list.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
        }
        return { ...prev, program: { ...prev.program, sessions }, done };
      });
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
      setState((prev) => ({
        ...prev,
        steps: { ...prev.steps, [date]: Math.max(0, Math.round(count)) },
      }));
    },
    [setState],
  );

  const setStepGoal = useCallback(
    (count: number) =>
      setState((prev) => ({ ...prev, stepGoal: Math.max(1000, Math.round(count)) })),
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
    (minutes: number) =>
      setState((prev) => ({ ...prev, movementGoal: Math.max(5, Math.round(minutes)) })),
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

  const currentWeek = weekStartKey();
  const weekFeedback = state.weekFeedback?.[currentWeek] ?? null;

  const setWeekFeedback = useCallback(
    (feedback: WeekFeedback, week = weekStartKey()) => {
      setState((prev) => ({
        ...prev,
        weekFeedback: { ...(prev.weekFeedback ?? {}), [week]: feedback },
      }));
    },
    [setState],
  );

  /** Bygger en ny veckoplan från senaste 7 dagarna + veckans känsla. */
  const regenerateWeeklyPlan = useCallback(() => {
    let created: WeeklyPlan | null = null;
    setState((prev) => {
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const steps = days.map((k) => prev.steps[k] ?? 0);
      const movementMinutes = days.map((k) =>
        (prev.movement?.[k] ?? []).reduce((sum, id) => sum + (movementById(id)?.minutes ?? 0), 0),
      );
      const doneSessions = days.reduce((sum, k) => sum + (prev.done[k]?.length ?? 0), 0);
      const week = weekStartKey();
      const plan = buildWeeklyPlan({
        steps,
        movementMinutes,
        doneSessions,
        plannedSessions:
          prev.program?.sessions.filter((s) => s.type !== "vila").length ??
          prev.goal?.daysPerWeek ??
          0,
        currentStepGoal: prev.stepGoal,
        currentMovementGoal: prev.movementGoal ?? 20,
        feedback: prev.weekFeedback?.[week] ?? null,
      });
      created = plan;
      return {
        ...prev,
        weeklyPlan: plan,
        stepGoal: plan.stepTarget,
        movementGoal: plan.movementTarget,
      };
    });
    return created;
  }, [setState]);

  const setWeight = useCallback(
    (kg: number, date = todayKey(), note?: string) => {
      setState((prev) => {
        const notes = { ...(prev.weightNotes ?? {}) };
        const trimmed = note?.trim();
        if (trimmed) notes[date] = trimmed;
        else delete notes[date];
        return {
          ...prev,
          weights: { ...(prev.weights ?? {}), [date]: Math.max(20, Math.round(kg * 10) / 10) },
          weightNotes: notes,
        };
      });
    },
    [setState],
  );

  const removeWeight = useCallback(
    (date: string) => {
      setState((prev) => {
        const weights = { ...(prev.weights ?? {}) };
        const notes = { ...(prev.weightNotes ?? {}) };
        delete weights[date];
        delete notes[date];
        return { ...prev, weights, weightNotes: notes };
      });
    },
    [setState],
  );

  const setWeightGoal = useCallback(
    (kg: number | null) =>
      setState((prev) => ({
        ...prev,
        weightGoal: kg === null ? null : Math.max(20, Math.round(kg * 10) / 10),
      })),
    [setState],
  );

  const weightEntries = useCallback(() => {
    return Object.entries(state.weights ?? {})
      .map(([date, kg]) => ({ date, kg, note: state.weightNotes?.[date] ?? "" }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.weights, state.weightNotes]);

  return {
    state,
    saveProgram,
    clearProgram,
    updateSession,
    addSession,
    addSessions,
    removeSession,
    toggleSessionDone,
    setSteps,
    setWeight,
    removeWeight,
    setWeightGoal,
    weightEntries,
    weightGoal: state.weightGoal ?? null,
    weightToday: state.weights?.[todayKey()] ?? null,
    setStepGoal,

    lastDays,
    toggleMovement,
    setMovementGoal,
    movementDays,
    weeklyPlan: state.weeklyPlan ?? null,
    weekFeedback,
    setWeekFeedback,
    regenerateWeeklyPlan,
    currentWeek,
    movementToday: state.movement?.[todayKey()] ?? [],
    movementGoal: state.movementGoal ?? 20,
    doneToday: state.done[todayKey()] ?? [],
    stepsToday: state.steps[todayKey()] ?? 0,
  };
}
