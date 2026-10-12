import { describe, expect, it } from "vitest";
import { energyPercent, percentNote, percentToLevel } from "./energy-percent";
import { dayCapacity } from "./day-capacity";
import { itemCost } from "./energy-battery";
import { balanceFor } from "./energy-flow";

it.each([0, 1, 37, 52, 57, 99, 100])(
  "retains %s percent in the shared day capacity after a cloud round trip",
  (percent) => {
    const row = JSON.parse(
      JSON.stringify({
        level: percentToLevel(percent),
        note: percentNote(percent),
        logged_at: "2026-10-12T10:00:00Z",
      }),
    );
    expect(dayCapacity("2026-10-12", {}, [row], "2026-10-12").percent).toBe(percent);
  },
);
it("keeps legacy observations and malformed notes on their existing scale", () => {
  expect(energyPercent({ level: 3 })).toBe(50);
  expect(energyPercent({ level: 3, note: "Självskattad energi: 200 %." })).toBe(50);
  expect(energyPercent({ level: 2, note: "Vanlig anteckning" })).toBe(25);
  expect(percentNote(57, "Efter vila")).toBe("Självskattad energi: 57 %.\nEfter vila");
  expect(() => percentNote(NaN)).toThrow();
});
it("does not equate start resistance, mixed or unknown energy with an energy loss", () => {
  expect(itemCost({ id: "one", title: "Tvätt", energyImpact: "drains", friction: "large" })).toBe(
    itemCost({ id: "one", title: "Tvätt", energyImpact: "drains", friction: "small" }),
  );
  expect(itemCost({ id: "one", title: "Tvätt", energyImpact: "unknown" })).toBe(0);
  expect(itemCost({ id: "one", title: "Tvätt", energyImpact: "both" })).toBe(0);
  const mixed = {
    id: "mixed",
    title: "Promenad",
    direction: "both" as const,
    strength: 3,
    category: "annat" as const,
    kind: "vardag" as const,
    friction: null,
    note: null,
    countsTowardScore: true,
    occurredAt: new Date().toISOString(),
  };
  expect(balanceFor([mixed]).net).toBe(0);
});
