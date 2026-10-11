import { describe, expect, it } from "vitest";
import {
  manualWorkout,
  sessionFromWorkout,
  trainingWorkoutRequest,
  visualTrainingSession,
} from "@/lib/training-program";
import { DEFAULT_REQUEST, generateWorkout } from "@/lib/workout-generator";
import { exerciseById } from "@/lib/exercise-library";
import type { TrainingGoal } from "@/hooks/use-training";

const goal: TrainingGoal = {
  goal: "Mer styrka",
  focus: "styrka",
  daysPerWeek: 2,
  days: ["Måndag", "Fredag"],
  minutesPerSession: 20,
  level: "nybörjare",
};

describe("visual programs", () => {
  it("preserves visual blocks, timing and instructions through saving and reload", () => {
    const workout = generateWorkout({ ...DEFAULT_REQUEST, minutes: 20 });
    const reloaded = JSON.parse(JSON.stringify(sessionFromWorkout(workout, "Fredag")));
    expect(reloaded.workout).toEqual(workout);
    expect(reloaded.day).toBe("Fredag");
    expect(reloaded.exercises).toHaveLength(workout.blocks.length);
    expect(reloaded.exercises[0]).toContain("×");
    for (const block of reloaded.workout.blocks)
      expect(exerciseById(block.exerciseId)?.visual).toBeTruthy();
  });

  it("turns an AI weekly session into a usable illustrated pass on the chosen day", () => {
    const workout = generateWorkout({ ...DEFAULT_REQUEST, minutes: 20 });
    const session = visualTrainingSession(
      {
        day: "Måndag",
        title: "Min styrka",
        type: "styrka",
        minutes: 20,
        exercises: [],
        blocks: workout.blocks,
      },
      goal,
    );
    expect(session.title).toBe("Min styrka");
    expect(session.day).toBe("Måndag");
    expect(session.workout?.blocks.length).toBeGreaterThanOrEqual(3);
    expect(session.exercises.length).toBe(session.workout?.blocks.length);
  });

  it("rejects unusable invented images instead of saving a misleading program", () => {
    expect(() =>
      visualTrainingSession(
        {
          day: "Måndag",
          title: "Fel",
          type: "styrka",
          exercises: [],
          blocks: [{ exerciseId: "invented", sets: 1 }],
        },
        goal,
      ),
    ).toThrow(/Skapa manuellt/);
  });

  it("filters missing equipment and sore areas from AI suggestions", () => {
    const source = generateWorkout({
      ...DEFAULT_REQUEST,
      equipment: ["kroppsvikt", "hantlar"],
      minutes: 30,
    });
    const session = visualTrainingSession(
      {
        day: "Måndag",
        title: "Pass",
        type: "styrka",
        exercises: [],
        blocks: [...source.blocks, { exerciseId: "biceps-curl", sets: 2, reps: 10 }],
      },
      { ...goal, limitations: "ont i knäna" },
    );
    for (const block of session.workout!.blocks) {
      const exercise = exerciseById(block.exerciseId)!;
      expect(exercise.equipment).toContain("kroppsvikt");
      expect(exercise.avoid ?? []).not.toContain("knän");
    }
  });

  it("does not invent future energy or parse minutes from limitations", () => {
    const request = trainingWorkoutRequest({ ...goal, limitations: "låg energi, bara 10 min" });
    expect(request.energy).toBe("normal");
    expect(request.minutes).toBe(20);
  });

  it("keeps manual doses and ordering without AI or generated replacements", () => {
    const blocks = [
      {
        exerciseId: "sit-to-stand",
        sets: 1,
        reps: 6,
        restSeconds: 60,
        section: "huvuddel" as const,
      },
    ];
    const workout = manualWorkout("Mitt pass", blocks, "styrka");
    expect(workout.blocks).toEqual(blocks);
    expect(sessionFromWorkout(workout).exercises).toEqual(["Sitt-till-stå (box squat) – 1 × 6 reps"]);
    expect(manualWorkout("Nytt namn", blocks, "styrka", workout).id).toBe(workout.id);
  });
});
