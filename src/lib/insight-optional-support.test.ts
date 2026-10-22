import { describe, expect, it } from "vitest";
import { optionalSupportForInsight } from "./insight-optional-support";
import { areaForPersonalInsight } from "./insight-personal";
import type { PersonalInsight } from "./insight-personal";

const observed = (id: string): PersonalInsight => ({ id, text: "Ett möjligt mönster", confidence: "ser" });

describe("One optional next step from a personal insight", () => {
  it("reuses an existing support strategy associated with the observation", () => {
    const strategy = optionalSupportForInsight(observed("mornings"), 5);
    expect(areaForPersonalInsight("mornings")).toBe("tid");
    expect(strategy).toMatchObject({ id: "time-visible", areaId: "tid" });
    expect(strategy?.friction).toBeLessThanOrEqual(5);
  });

  it("offers nothing for missing signals, unknown areas, or inaccessible effort levels", () => {
    expect(optionalSupportForInsight(undefined, 5)).toBeNull();
    expect(optionalSupportForInsight(observed("unrecognized-signal"), 5)).toBeNull();
    expect(optionalSupportForInsight(observed("mornings"), 0)).toBeNull();
    expect(optionalSupportForInsight(observed("mornings"), Number.NaN)).toBeNull();
  });

  it("does not mutate registered insights or generate new activities", () => {
    const insight = observed("energy-dip");
    const original = { ...insight };
    const proposed = optionalSupportForInsight(insight, 5);
    expect(proposed?.areaId).toBe("energi");
    expect(insight).toEqual(original);
  });
});
