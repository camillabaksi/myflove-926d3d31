import { describe, expect, it } from "vitest";
import { EXERCISES, exerciseById } from "@/lib/exercise-library";
import {
  DEFAULT_REQUEST,
  energyFromScore,
  generateWorkout,
  parseWorkoutText,
  swapExercise,
  workoutMinutes,
} from "@/lib/workout-generator";

describe("parseWorkoutText", () => {
  it("läser tid, plats, utrustning, fokus och ömma områden", () => {
    const req = parseWorkoutText(
      "Jag vill träna hemma i 30 minuter. Jag har hantlar och kettlebell. Jag har ont i knäna och höger skuldra och vill fokusera på rumpa och mage.",
      DEFAULT_REQUEST,
    );
    expect(req.minutes).toBe(30);
    expect(req.place).toBe("hemma");
    expect(req.equipment).toContain("hantlar");
    expect(req.equipment).toContain("kettlebell");
    expect(req.focus).toEqual(expect.arrayContaining(["underkropp", "bål"]));
    expect(req.limitations).toEqual(expect.arrayContaining(["knän", "skuldra"]));
  });

  it("lämnar fältet orört när inget nämns", () => {
    const req = parseWorkoutText("bara röra på mig", DEFAULT_REQUEST);
    expect(req.minutes).toBe(DEFAULT_REQUEST.minutes);
    expect(req.limitations).toEqual([]);
  });
});

describe("generateWorkout", () => {
  it("har en unik realistisk visual för varje övning", () => {
    expect(EXERCISES).toHaveLength(58);
    expect(new Set(EXERCISES.map((exercise) => exercise.visual)).size).toBe(EXERCISES.length);
    for (const exercise of EXERCISES) {
      expect(exercise.visual).toBe(exercise.id);
    }
  });

  it("undviker övningar som belastar angivna områden", () => {
    const w = generateWorkout({
      ...DEFAULT_REQUEST,
      equipment: ["kroppsvikt", "hantlar"],
      limitations: ["knän", "skuldra"],
      focus: ["underkropp", "bål"],
    });
    for (const block of w.blocks) {
      const ex = exerciseById(block.exerciseId)!;
      expect(ex.avoid ?? []).not.toContain("knän");
      expect(ex.avoid ?? []).not.toContain("skuldra");
    }
  });

  it("håller sig ungefär inom vald tid och har uppvärmning och nedvarvning", () => {
    const w = generateWorkout({ ...DEFAULT_REQUEST, minutes: 30 });
    expect(workoutMinutes(w)).toBeLessThanOrEqual(36);
    expect(w.blocks.some((b) => b.section === "uppvärmning")).toBe(true);
    expect(w.blocks.some((b) => b.section === "nedvarvning")).toBe(true);
    expect(w.blocks.some((b) => b.section === "huvuddel")).toBe(true);
  });

  it("gör ett kortare, mjukare pass vid låg energi", () => {
    const low = generateWorkout({ ...DEFAULT_REQUEST, energy: "låg" });
    const normal = generateWorkout({ ...DEFAULT_REQUEST, energy: "normal" });
    expect(workoutMinutes(low)).toBeLessThanOrEqual(workoutMinutes(normal));
    expect(low.note).toContain("låg energi");
    for (const b of low.blocks) {
      expect(exerciseById(b.exerciseId)!.difficulty).not.toBe("utmanande");
    }
  });

  it("använder bara övningar som passar vald utrustning", () => {
    const w = generateWorkout({ ...DEFAULT_REQUEST, equipment: ["kroppsvikt"] });
    for (const b of w.blocks) {
      expect(exerciseById(b.exerciseId)!.equipment).toContain("kroppsvikt");
    }
  });

  it("ger en grov kaloriintervall", () => {
    const w = generateWorkout(DEFAULT_REQUEST);
    expect(w.kcalHigh).toBeGreaterThan(w.kcalLow);
  });
});

describe("swapExercise", () => {
  it("byter till en annan övning utan dubbletter", () => {
    const w = generateWorkout(DEFAULT_REQUEST);
    const i = w.blocks.findIndex((b) => b.section === "huvuddel");
    const swapped = swapExercise(w, i);
    expect(swapped.blocks[i].exerciseId).not.toBe(w.blocks[i].exerciseId);
    const ids = swapped.blocks.map((b) => b.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("energyFromScore", () => {
  it("mappar FlowScore till energinivå", () => {
    expect(energyFromScore(30)).toBe("låg");
    expect(energyFromScore(55)).toBe("normal");
    expect(energyFromScore(85)).toBe("mycket");
    expect(energyFromScore(null)).toBe("normal");
  });
});
