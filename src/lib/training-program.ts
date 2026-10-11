import { exerciseById } from "@/lib/exercise-library";
import {
  buildWorkoutFromPlan,
  DEFAULT_REQUEST,
  parseWorkoutText,
  workoutMinutes,
  type AiWorkoutPlan,
  type Workout,
  type WorkoutBlock,
} from "@/lib/workout-generator";
import type { TrainingGoal, TrainingSession } from "@/hooks/use-training";

/** Keep the complete visual pass in the existing account-owned program. */
export function sessionFromWorkout(workout: Workout, day = "Valfri dag"): TrainingSession {
  return {
    day,
    title: workout.title,
    type:
      workout.intent === "rörlighet"
        ? "rörlighet"
        : workout.intent === "återhämtning"
          ? "vila"
          : "styrka",
    minutes: workout.minutes,
    exercises: workout.blocks.map((block) => {
      const name = exerciseById(block.exerciseId)?.name ?? block.exerciseId;
      const dose = block.seconds
        ? `${block.sets} × ${block.seconds} sek`
        : `${block.sets} × ${block.reps} reps`;
      return `${name} – ${dose}`;
    }),
    workout,
  };
}

/** A reusable weekly template never predicts capacity on future days. */
export function trainingWorkoutRequest(goal: TrainingGoal) {
  const parsed = parseWorkoutText(
    [goal.equipment, goal.limitations ? `Känsligt eller ont: ${goal.limitations}` : ""]
      .filter(Boolean)
      .join(". "),
    { ...DEFAULT_REQUEST, minutes: Math.min(90, goal.minutesPerSession), energy: "normal" },
  );
  return { ...parsed, minutes: Math.min(90, goal.minutesPerSession), energy: "normal" as const };
}

/** Manual blocks stay exactly as chosen; no generator or AI rewrites them. */
export function manualWorkout(
  title: string,
  blocks: WorkoutBlock[],
  type: TrainingSession["type"],
  previous?: Workout,
): Workout {
  const workout: Workout = {
    ...DEFAULT_REQUEST,
    ...(previous ?? {}),
    id: previous?.id ?? `manual-${crypto.randomUUID()}`,
    createdAt: previous?.createdAt ?? Date.now(),
    title,
    note: "Ditt eget upplägg, i din takt.",
    blocks,
    equipment: [
      ...new Set(
        blocks.flatMap((block) => {
          const exercise = exerciseById(block.exerciseId);
          const matching = exercise?.equipment.find((item) => previous?.equipment.includes(item));
          return matching ? [matching] : (exercise?.equipment.slice(0, 1) ?? []);
        }),
      ),
    ],
    intent: type === "rörlighet" ? "rörlighet" : type === "vila" ? "återhämtning" : "eget",
    kcalLow: 0,
    kcalHigh: 0,
  };
  workout.minutes = workoutMinutes(workout);
  // Use the same coarse range as the existing generator.
  const intensity =
    blocks.reduce((sum, block) => sum + (exerciseById(block.exerciseId)?.intensity ?? 1), 0) /
    Math.max(1, blocks.length);
  workout.kcalLow = Math.round(workout.minutes * (2.5 + intensity));
  workout.kcalHigh = Math.round(workout.minutes * (4 + intensity * 1.5));
  return workout;
}

export function visualTrainingSession(
  session: Omit<TrainingSession, "workout"> & { blocks?: AiWorkoutPlan["blocks"] },
  goal: TrainingGoal,
): TrainingSession {
  const { blocks, ...plain } = session;
  // Rest days and existing text-only programs remain valid.
  if (!blocks?.length && session.type === "vila") return plain;
  const request = trainingWorkoutRequest(goal);
  const workout = buildWorkoutFromPlan(
    {
      title: session.title,
      blocks: (blocks ?? []).filter((block) => {
        const exercise = exerciseById(block.exerciseId);
        return (
          exercise?.equipment.some((item) => request.equipment.includes(item)) &&
          (goal.level !== "nybörjare" || exercise.difficulty !== "utmanande")
        );
      }),
      note: "Ditt planerade pass. Anpassa tempot efter hur du mår när du tränar.",
    },
    {
      ...request,
      intent:
        session.type === "rörlighet"
          ? "rörlighet"
          : session.type === "vila"
            ? "återhämtning"
            : session.type === "kondition"
              ? "eget"
              : "styrka",
      minutes: Math.min(90, session.minutes ?? goal.minutesPerSession),
    },
  );
  if (!workout)
    throw new Error(
      "Pace kunde inte skapa ett tydligt bildpass. Försök igen eller välj Skapa manuellt.",
    );
  return { ...plain, ...sessionFromWorkout(workout, session.day), type: session.type };
}
