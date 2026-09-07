import { describe, it, expect } from "vitest";
import { buildEveningInsight, expectedLoad, type EveningSample } from "@/lib/evening-insight";

const day = (n: number, s: Partial<EveningSample>): EveningSample => ({
  day: `2026-09-0${n}`,
  answer: "som-vantat",
  ...s,
});

describe("kvällscheckens samband", () => {
  it("beskriver dagen när den blev tyngre än en full plan", () => {
    const today = day(7, { answer: "tyngre", ork10: 4, planned: 6, done: 2 });
    const insight = buildEveningInsight([today], today);
    expect(expectedLoad(today)).toBe("full");
    expect(insight.todayLine).toContain("6 saker");
  });

  it("hittar mönstret mellan antal saker och hur dagen kändes", () => {
    const history: EveningSample[] = [
      day(1, { answer: "som-vantat", ork10: 7, planned: 3, done: 3 }),
      day(2, { answer: "lattare", ork10: 8, planned: 3, done: 3 }),
      day(3, { answer: "tyngre", ork10: 3, planned: 7, done: 2 }),
      day(4, { answer: "tyngre", ork10: 4, planned: 6, done: 1 }),
    ];
    const insight = buildEveningInsight(history, null);
    expect(insight.days).toBe(4);
    expect(insight.comfortableLoad).toBe(3);
    expect(insight.patternLine).toContain("3 saker");
    expect(insight.patternLine).toContain("låg ork");
  });

  it("visar inget mönster innan det finns tillräckligt med kvällar", () => {
    const insight = buildEveningInsight([day(1, { planned: 2 })], null);
    expect(insight.patternLine).toBeNull();
  });
});
