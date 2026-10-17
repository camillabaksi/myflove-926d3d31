import { describe, expect, it } from "vitest";
import { personalRecoverySuggestions } from "./personal-recovery";
import type { EnergyFactorEntry } from "./energy-flow";
const now = Date.parse("2026-10-17T12:00:00Z");
const item = (title: string, direction: EnergyFactorEntry["direction"], offset: number): EnergyFactorEntry => ({ id: title + offset, title, direction, strength: 3, category: "aterhamtning", kind: "aterhamtning", friction: null, note: null, countsTowardScore: true, occurredAt: new Date(now - offset * 86400000).toISOString() });
describe("personal recovery", () => {
  it("only uses confirmed positive experiences", () => { expect(personalRecoverySuggestions([item("Musik", "gives", 1), item("Städning", "drains", 1)], { now }).map(x => x.title)).toEqual(["Musik"]); });
  it("does not treat one log as a pattern", () => { expect(personalRecoverySuggestions([item("Musik", "gives", 1)], { now })[0]?.repeated).toBe(false); });
  it("rejects conflicting effects", () => { expect(personalRecoverySuggestions([item("Musik", "gives", 1), item("Musik", "drains", 2)], { now })).toEqual([]); });
  it("rejects stale and future logs", () => { expect(personalRecoverySuggestions([item("Old", "gives", 61), item("Future", "gives", -1)], { now })).toEqual([]); });
});
