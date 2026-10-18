/**
 * Motorn bakom "Automatiskt pass".
 *
 * Räknar på klockan (inte på antal ticks), så tiden stämmer även om skärmen
 * släcks eller appen ligger i bakgrunden en stund. Hooken äger bara tid och
 * position i tidslinjen – all text och allt ljud ligger i UI:t.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimelineStep } from "@/lib/workout-timeline";

export interface WorkoutTimerState {
  step: TimelineStep | undefined;
  stepIndex: number;
  totalSteps: number;
  /** Sekunder kvar på momentet, `null` för repmoment som väntar på användaren. */
  remaining: number | null;
  running: boolean;
  finished: boolean;
  /** Övning x av y, räknat på unika block. */
  exerciseNumber: number;
  totalExercises: number;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
}

export function useWorkoutTimer(
  steps: TimelineStep[],
  options: {
    totalExercises: number;
    onStepStart?: (step: TimelineStep) => void;
    onFinish?: () => void;
    autoStart?: boolean;
  },
): WorkoutTimerState {
  const { totalExercises, onStepStart, onFinish, autoStart = true } = options;
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const endsAtRef = useRef<number | null>(null);
  const startedRef = useRef<string | null>(null);
  const onStepStartRef = useRef(onStepStart);
  const onFinishRef = useRef(onFinish);
  onStepStartRef.current = onStepStart;
  onFinishRef.current = onFinish;

  const step = steps[stepIndex];

  // Nytt moment: nollställ klockan och meddela UI:t en gång.
  useEffect(() => {
    if (finished || !step) return;
    if (startedRef.current === `${stepIndex}-${step.id}`) return;
    startedRef.current = `${stepIndex}-${step.id}`;
    if (step.seconds == null) {
      endsAtRef.current = null;
      setRemaining(null);
    } else {
      endsAtRef.current = running ? Date.now() + step.seconds * 1000 : null;
      setRemaining(step.seconds);
    }
    onStepStartRef.current?.(step);
  }, [step, stepIndex, finished]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        setFinished(true);
        setRunning(false);
        onFinishRef.current?.();
        return;
      }
      setStepIndex(Math.max(0, index));
    },
    [steps.length],
  );

  // Själva nedräkningen.
  useEffect(() => {
    if (!running || finished || !step || step.seconds == null) return;
    const tick = () => {
      const endsAt = endsAtRef.current;
      if (endsAt == null) return;
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) goTo(stepIndex + 1);
    };
    const id = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(id);
  }, [running, finished, step, stepIndex, goTo]);

  const pause = useCallback(() => {
    setRunning((wasRunning) => {
      if (!wasRunning) return wasRunning;
      if (endsAtRef.current != null) {
        setRemaining(Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000)));
      }
      return false;
    });
  }, []);

  const resume = useCallback(() => {
    setRunning((wasRunning) => {
      if (wasRunning) return wasRunning;
      setRemaining((left) => {
        if (left != null) endsAtRef.current = Date.now() + left * 1000;
        return left;
      });
      return true;
    });
  }, []);

  const toggle = useCallback(() => {
    if (running) pause();
    else resume();
  }, [running, pause, resume]);

  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex]);

  const previous = useCallback(() => {
    if (stepIndex === 0) {
      startedRef.current = null;
      const first = steps[0];
      if (first?.seconds != null) {
        endsAtRef.current = Date.now() + first.seconds * 1000;
        setRemaining(first.seconds);
      }
      return;
    }
    // Hoppa till föregående övnings början, inte till vilan före.
    const current = steps[stepIndex];
    let target = stepIndex - 1;
    while (target > 0 && steps[target]?.kind === "vila") target -= 1;
    if (current && steps[target]?.blockIndex === current.blockIndex && target > 0) {
      const blockIndex = current.blockIndex;
      while (target > 0 && steps[target - 1]?.blockIndex === blockIndex) target -= 1;
      if (target > 0) target -= 1;
      while (target > 0 && steps[target - 1]?.blockIndex === steps[target]?.blockIndex) target -= 1;
    }
    setFinished(false);
    goTo(target);
  }, [goTo, stepIndex, steps]);

  const restart = useCallback(() => {
    startedRef.current = null;
    setFinished(false);
    setStepIndex(0);
    setRunning(true);
  }, []);

  const exerciseNumber = useMemo(() => {
    if (!step) return totalExercises;
    return step.blockIndex + 1;
  }, [step, totalExercises]);

  return {
    step,
    stepIndex,
    totalSteps: steps.length,
    remaining,
    running,
    finished,
    exerciseNumber,
    totalExercises,
    pause,
    resume,
    toggle,
    next,
    previous,
    restart,
  };
}
