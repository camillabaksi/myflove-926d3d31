import { describe, expect, it } from "vitest";
import { capacityWithActivityFeedback } from "./capacity-activity-feedback";
import type { DayCapacity } from "./day-capacity";
import type { EnergyFactorEntry } from "./energy-flow";

const base: DayCapacity = { percent: 50, source: "morning", morning: 50, reportedLevel: null };
const factor = (id: string, direction: EnergyFactorEntry["direction"], strength = 1): EnergyFactorEntry => ({
  id, title: "Promenad", direction, strength, category: "annat", kind: "planerat",
  friction: null, note: "Genomförd aktivitet", countsTowardScore: true,
  occurredAt: "2026-10-18T10:00:00+02:00",
});
describe("capacityWithActivityFeedback", () => {
  const cutoff = "2026-10-18T08:00:00+02:00";
  it("changes only after manual check-in based on explicit completed activity feedback", () => {
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "gives")], cutoff).percent).toBe(52);
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "drains", 4)], cutoff).percent).toBe(42);
  });
  it("does not double-count duplicate factor IDs", () => {
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "gives"), factor("a", "gives")], cutoff).percent).toBe(52);
  });
  it("never guesses when no manual baseline exists", () => {
    expect(capacityWithActivityFeedback({ ...base, percent: null, source: null }, "2026-10-18", [factor("a", "gives")], cutoff).percent).toBeNull();
  });
  it("ignores feedback before a newer manual check-in and without reliable timestamps", () => {
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "gives")], "2026-10-18T11:00:00+02:00").percent).toBe(50);
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "gives")]).percent).toBe(50);
  });
  it("does not infer a net effect from both or neutral", () => {
    expect(capacityWithActivityFeedback(base, "2026-10-18", [factor("a", "both"), factor("b", "neutral")], cutoff).percent).toBe(50);
  });
});
