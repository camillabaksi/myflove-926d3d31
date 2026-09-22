import { describe, expect, it } from "vitest";
import { buildEnergyMoodTrend } from "@/lib/energy-mood-trend";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

const entry = (occurredAt: string, direction: "gives" | "drains", strength: number) =>
  ({
    id: occurredAt + direction,
    title: "x",
    direction,
    strength,
    category: "rorelse",
    kind: "vardag",
    friction: null,
    note: null,
    countsTowardScore: true,
    occurredAt,
  }) as EnergyFactorEntry;

describe("buildEnergyMoodTrend", () => {
  const now = new Date(2026, 8, 22, 12, 0, 0);

  it("ger tomma perioder utan data", () => {
    const trend = buildEnergyMoodTrend([], [], now);
    expect(trend.periods.weeks).toHaveLength(8);
    expect(trend.periods.months).toHaveLength(6);
    expect(trend.direction).toBe("unknown");
    expect(trend.periods.weeks.every((p) => p.energy === null && p.mood === null)).toBe(true);
  });

  it("räknar energi och mående till rätt period", () => {
    const trend = buildEnergyMoodTrend(
      [entry(new Date(2026, 8, 22, 9).toISOString(), "gives", 5)],
      [{ id: "m", score: 5, date: new Date(2026, 8, 22, 10).getTime() }],
      now,
    );
    const last = trend.periods.weeks[7]!;
    expect(last.energy).toBe(100);
    expect(last.mood).toBe(100);
    expect(last.energyLogs).toBe(1);
    expect(last.moodLogs).toBe(1);
  });

  it("jämför senaste perioden med den innan", () => {
    const trend = buildEnergyMoodTrend(
      [
        entry(new Date(2026, 8, 15, 9).toISOString(), "drains", 4),
        entry(new Date(2026, 8, 22, 9).toISOString(), "gives", 4),
      ],
      [],
      now,
    );
    expect(trend.direction).toBe("up");
  });
});
