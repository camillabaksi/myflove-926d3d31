import { describe, it, expect } from "vitest";
import { parseExerciseBlocks, draftToSaved, savedExercisesContext, ownerLine } from "@/lib/saved-exercises";

const reply = 'Här är en idé.\n```flow-exercise\n{"title":"Nallebjörns-andningen","steps":["Lägg nallen på magen","Andas in","Andas ut"],"minutes":3,"forChild":true,"icon":"🧸","situation":"läggdags"}\n```\n```flow-saved\n{"id":"ex-1"}\n```';

describe("saved exercises", () => {
  it("parsar övning och sparat förslag och tar bort blocken", () => {
    const p = parseExerciseBlocks(reply);
    expect(p.text).toBe("Här är en idé.");
    expect(p.exercises[0]?.steps).toHaveLength(3);
    expect(p.savedIds).toEqual(["ex-1"]);
  });
  it("sparar för barn med barnprofil och datum", () => {
    const d = parseExerciseBlocks(reply).exercises[0]!;
    const s = draftToSaved(d, "barn", "kid-1");
    expect(s.childId).toBe("kid-1");
    expect(s.savedAt).toBeTruthy();
    expect(ownerLine(s, "Bianca")).toBe("En övning ni sparat för Bianca.");
    expect(savedExercisesContext([s], () => "Bianca")).toContain("för: Bianca");
  });
  it("ignorerar trasiga block", () => {
    expect(parseExerciseBlocks("```flow-exercise\n{oops}\n```hej").exercises).toHaveLength(0);
  });
});
