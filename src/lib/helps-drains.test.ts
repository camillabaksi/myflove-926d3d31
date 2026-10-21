import { describe, expect, it } from "vitest";
import { buildHelpsDrains } from "@/lib/helps-drains";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

const e = (category: string, direction: "gives" | "drains") =>
  ({ id: Math.random().toString(), title: "privat", direction, strength: 3, category, kind: "vardag", friction: null, note: null, countsTowardScore: true, occurredAt: new Date().toISOString() }) as EnergyFactorEntry;

describe("buildHelpsDrains", () => {
  it("kräver minst tre svar per kategori", () => {
    expect(buildHelpsDrains([e("rorelse", "gives"), e("rorelse", "gives")]).helps).toHaveLength(0);
  });
  it("delar upp i hjälper och tar energi med andel", () => {
    const r = buildHelpsDrains([
      e("rorelse", "gives"), e("rorelse", "gives"), e("rorelse", "drains"),
      e("stress", "drains"), e("stress", "drains"), e("stress", "drains"),
    ]);
    expect(r.helps[0]).toMatchObject({ category: "rorelse", share: 67, answers: 3 });
    expect(r.drains[0]).toMatchObject({ category: "stress", share: 100 });
  });
});
