import { describe, expect, it } from "vitest";
import { buildPersonalInsight, hasEnoughData } from "@/lib/insight-personal";
import type { FlowKnowledge } from "@/lib/flow-learning";

const knowledge = (insights: FlowKnowledge["insights"]): FlowKnowledge => ({
  level: 42,
  label: "Jag börjar få koll på dig",
  insights,
});

describe("hasEnoughData", () => {
  it("kräver ett minsta underlag", () => {
    expect(hasEnoughData({ activeDays: 0, completedCount: 0, energyCount: 0 })).toBe(false);
    expect(hasEnoughData({ activeDays: 1, completedCount: 2, energyCount: 1 })).toBe(false);
    expect(hasEnoughData({ activeDays: 3, completedCount: 0, energyCount: 0 })).toBe(true);
    expect(hasEnoughData({ activeDays: 0, completedCount: 5, energyCount: 0 })).toBe(true);
    expect(hasEnoughData({ activeDays: 0, completedCount: 0, energyCount: 3 })).toBe(true);
  });
});

describe("buildPersonalInsight", () => {
  it("visar användarens egna insikter när underlag finns", () => {
    const view = buildPersonalInsight(
      knowledge([
        { id: "mornings", text: "Dina morgnar fungerar.", confidence: "ser" },
        { id: "postponed", text: "Vissa saker blir liggande.", confidence: "ser" },
      ]),
      { activeDays: 7, completedCount: 12, energyCount: 4 },
    );
    expect(view.ready).toBe(true);
    expect(view.insights.map((i) => i.id)).toEqual(["mornings", "postponed"]);
    expect(view.areas).toEqual(["tid", "exekutiva"]);
  });

  it("ger tomläge när underlaget är för litet", () => {
    const view = buildPersonalInsight(
      knowledge([{ id: "mornings", text: "Dina morgnar fungerar.", confidence: "börjar" }]),
      { activeDays: 1, completedCount: 1, energyCount: 0 },
    );
    expect(view.ready).toBe(false);
    expect(view.insights).toEqual([]);
    expect(view.areas).toEqual([]);
  });

  it("räknar inte uppstartshälsningen som en personlig slutsats", () => {
    const view = buildPersonalInsight(
      knowledge([{ id: "start", text: "Ju mer du använder mig…", confidence: "börjar" }]),
      { activeDays: 30, completedCount: 40, energyCount: 20 },
    );
    expect(view.ready).toBe(false);
    expect(view.insights).toEqual([]);
  });
});
