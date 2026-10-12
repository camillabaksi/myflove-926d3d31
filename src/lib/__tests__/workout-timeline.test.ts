import { describe, expect, it } from "vitest";
import { buildWorkoutTimeline } from "@/lib/workout-timeline";
import type { Workout } from "@/lib/workout-generator";

function workoutWith(blocks: Workout["blocks"]): Workout {
  return {
    id: "w-test",
    title: "Testpass",
    note: "",
    createdAt: 0,
    minutes: 20,
    energy: "normal",
    place: "hemma",
    equipment: ["kroppsvikt"],
    focus: ["helkropp"],
    limitations: [],
    intent: "styrka",
    blocks,
    kcalLow: 50,
    kcalHigh: 90,
  };
}

describe("buildWorkoutTimeline", () => {
  it("provides estimated timed repetitions per side only when the player requests them", () => {
    const workout = workoutWith([
      {
        exerciseId: "reverse-lunge",
        sets: 1,
        reps: 10,
        sideSplit: true,
        restSeconds: 0,
        section: "huvuddel",
      },
    ]);
    const work = buildWorkoutTimeline(workout, { timeReps: true }).filter(
      (step) => step.kind === "arbete",
    );
    expect(work.map((step) => [step.side, step.seconds, step.reps, step.estimated])).toEqual([
      ["höger", 40, 10, true],
      ["vänster", 40, 10, true],
    ]);
    expect(
      buildWorkoutTimeline(workout).find((step) => step.kind === "arbete")?.seconds,
    ).toBeNull();
  });
  it("lägger en förvarning före varje övning", () => {
    const steps = buildWorkoutTimeline(
      workoutWith([
        { exerciseId: "wall-sit", sets: 1, seconds: 30, restSeconds: 30, section: "huvuddel" },
        { exerciseId: "forearm-plank", sets: 1, seconds: 20, restSeconds: 30, section: "huvuddel" },
      ]),
    );
    const prep = steps.filter((s) => s.kind === "förvarning");
    expect(prep).toHaveLength(2);
    expect(prep[0]?.seconds).toBe(5);
    expect(prep[1]?.announce).toContain("Nästa övning");
  });

  it("delar tiden i höger och vänster med byt sida-prompt", () => {
    const steps = buildWorkoutTimeline(
      workoutWith([
        {
          exerciseId: "side-plank-knees",
          sets: 1,
          seconds: 90,
          restSeconds: 30,
          section: "huvuddel",
          sideSplit: true,
        },
      ]),
    );
    const work = steps.filter((s) => s.kind === "arbete");
    expect(work).toHaveLength(2);
    expect(work[0]?.side).toBe("höger");
    expect(work[0]?.seconds).toBe(45);
    expect(work[1]?.side).toBe("vänster");
    expect(work[1]?.seconds).toBe(45);
    expect(work[1]?.announce).toBe("Byt sida");
  });

  it("väntar på användaren vid repetitioner och vilar mellan set", () => {
    const steps = buildWorkoutTimeline(
      workoutWith([
        { exerciseId: "sit-to-stand", sets: 2, reps: 10, restSeconds: 45, section: "huvuddel" },
      ]),
    );
    const work = steps.filter((s) => s.kind === "arbete");
    expect(work).toHaveLength(2);
    expect(work[0]?.seconds).toBeNull();
    expect(work[0]?.reps).toBe(10);
    const rest = steps.filter((s) => s.kind === "vila");
    expect(rest).toHaveLength(1);
    expect(rest[0]?.seconds).toBe(45);
  });

  it("avslutar med arbete, inte med vila", () => {
    const steps = buildWorkoutTimeline(
      workoutWith([
        { exerciseId: "wall-sit", sets: 1, seconds: 30, restSeconds: 30, section: "huvuddel" },
      ]),
    );
    expect(steps.at(-1)?.kind).toBe("arbete");
  });
});
