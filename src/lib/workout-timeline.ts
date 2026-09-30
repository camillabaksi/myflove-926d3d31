/**
 * Tidslinjen för "Automatiskt pass" – ren logik, inget UI och inga timers.
 *
 * Den översätter ett vanligt `Workout` till en rak lista av moment:
 * förvarning → arbete (hela eller höger/vänster) → vila → nästa.
 * Allt är förutsägbart och testbart, så själva körningen bara följer listan.
 */

import { exerciseById } from "@/lib/exercise-library";
import type { Workout, WorkoutBlock } from "@/lib/workout-generator";

export type TimelineStepKind = "förvarning" | "arbete" | "vila";
export type ExerciseSide = "höger" | "vänster";

export interface TimelineStep {
  id: string;
  kind: TimelineStepKind;
  /** Index i workout.blocks som momentet hör till. */
  blockIndex: number;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  /** Sekunder momentet varar. `null` = väntar på att användaren markerar klart. */
  seconds: number | null;
  reps?: number;
  side?: ExerciseSide;
  /** Rubrik på skärmen. */
  title: string;
  /** Kort rad under rubriken. */
  detail: string;
  /** Det som sägs/visas när momentet startar. */
  announce: string;
}

export interface TimelineOptions {
  /** Nedräkning innan varje ny övning. */
  transitionSeconds?: number;
}

const DEFAULT_TRANSITION = 5;

function blockSideSplit(block: WorkoutBlock): boolean {
  if (block.sideSplit != null) return block.sideSplit;
  return exerciseById(block.exerciseId)?.sideSplit === true;
}

/**
 * Bygger hela passets moment i ordning. Sista vilan tas bort – passet ska
 * sluta med arbete, inte med väntan.
 */
export function buildWorkoutTimeline(workout: Workout, options?: TimelineOptions): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const blocks = workout.blocks;

  blocks.forEach((block, blockIndex) => {
    const ex = exerciseById(block.exerciseId);
    if (!ex) return;
    const name = ex.name;
    const sets = Math.max(1, block.sets);
    const split = blockSideSplit(block);
    const transition = Math.max(
      0,
      block.transitionSeconds ?? options?.transitionSeconds ?? DEFAULT_TRANSITION,
    );

    if (transition > 0) {
      steps.push({
        id: `t-${blockIndex}`,
        kind: "förvarning",
        blockIndex,
        exerciseId: block.exerciseId,
        exerciseName: name,
        setNumber: 1,
        totalSets: sets,
        seconds: transition,
        title: "Gör dig redo",
        detail: `Nästa övning: ${name}`,
        announce: `Nästa övning: ${name}`,
      });
    }

    for (let set = 1; set <= sets; set += 1) {
      const setLabel = sets > 1 ? `Set ${set} av ${sets}` : "Ett set";

      if (block.seconds != null) {
        if (split) {
          const half = Math.max(5, Math.round(block.seconds / 2));
          (["höger", "vänster"] as const).forEach((side, i) => {
            steps.push({
              id: `w-${blockIndex}-${set}-${side}`,
              kind: "arbete",
              blockIndex,
              exerciseId: block.exerciseId,
              exerciseName: name,
              setNumber: set,
              totalSets: sets,
              seconds: half,
              side,
              title: name,
              detail: `${setLabel} · ${side} sida · ${half} sek`,
              announce: i === 0 ? `${name}, höger sida` : "Byt sida",
            });
          });
        } else {
          steps.push({
            id: `w-${blockIndex}-${set}`,
            kind: "arbete",
            blockIndex,
            exerciseId: block.exerciseId,
            exerciseName: name,
            setNumber: set,
            totalSets: sets,
            seconds: block.seconds,
            title: name,
            detail: `${setLabel} · ${block.seconds} sek`,
            announce: set === 1 ? name : `${name}, set ${set}`,
          });
        }
      } else {
        const reps = block.reps ?? 10;
        steps.push({
          id: `w-${blockIndex}-${set}`,
          kind: "arbete",
          blockIndex,
          exerciseId: block.exerciseId,
          exerciseName: name,
          setNumber: set,
          totalSets: sets,
          seconds: null,
          reps,
          title: name,
          detail: split
            ? `${setLabel} · ${reps} repetitioner per sida`
            : `${setLabel} · ${reps} repetitioner`,
          announce: set === 1 ? name : `${name}, set ${set}`,
        });
      }

      const isLastSet = set === sets;
      // Mellan övningar räcker förvarningen – ingen extra vila.
      if (isLastSet) continue;
      if (block.restSeconds > 0) {
        steps.push({
          id: `r-${blockIndex}-${set}`,
          kind: "vila",
          blockIndex,
          exerciseId: block.exerciseId,
          exerciseName: name,
          setNumber: set,
          totalSets: sets,
          seconds: block.restSeconds,
          title: "Vila",
          detail: isLastSet ? "Nästa övning strax" : `Vila före set ${set + 1}`,
          announce: "Vila",
        });
      }
    }
  });

  return steps;
}

/** Ungefärlig total tid för tidslinjen i sekunder (repmoment räknas som 4 sek/rep). */
export function timelineSeconds(steps: TimelineStep[]): number {
  return steps.reduce((sum, s) => sum + (s.seconds ?? (s.reps ?? 10) * 4), 0);
}
