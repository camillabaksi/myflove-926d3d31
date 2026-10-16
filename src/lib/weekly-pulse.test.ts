import { describe, expect, it } from "vitest";
import { pulseActionInput, pulseMedian, pulseStatsSchema, pulseWeekStart } from "./weekly-pulse";

describe("Swedish calendar weeks", () => {
  it("changes weeks at Stockholm midnight rather than browser or UTC midnight", () => {
    expect(pulseWeekStart("2026-10-18T21:59:59Z")).toBe("2026-10-12");
    expect(pulseWeekStart("2026-10-18T22:00:00Z")).toBe("2026-10-19");
    expect(pulseWeekStart("2026-12-31T23:30:00Z")).toBe("2026-12-28");
  });
  it("handles both repeated DST hours and the following Monday", () => {
    expect(pulseWeekStart("2026-10-25T00:30:00Z")).toBe("2026-10-19");
    expect(pulseWeekStart("2026-10-25T01:30:00Z")).toBe("2026-10-19");
    expect(pulseWeekStart("2026-10-25T23:00:00Z")).toBe("2026-10-26");
  });
});
describe("Explicit valid answers", () => {
  const valid = {
    expectedUserId: "00000000-0000-4000-8000-000000000001",
    weekStart: "2026-10-12",
    action: "submit",
    revision: 0,
    consent: true,
    overview: 1,
    relief: 5,
    burden: 3,
  };
  it("requires all answers and explicit sharing without rounding or coercion", () => {
    expect(pulseActionInput.safeParse(valid).success).toBe(true);
    for (const patch of [
      { consent: false },
      { burden: undefined },
      { overview: 0 },
      { relief: 6 },
      { relief: 2.5 },
      { relief: "3" },
      { expectedUserId: "other" },
      { revision: -1 },
    ]) {
      expect(pulseActionInput.safeParse({ ...valid, ...patch }).success).toBe(false);
    }
  });
  it("keeps an empty distribution unknown and computes an ordinal median", () => {
    expect(pulseMedian([0, 0, 0, 0, 0])).toBeNull();
    expect(pulseMedian([1, 0, 0, 0, 1])).toBe(3);
    expect(pulseMedian([0, 0, 1, 2, 0])).toBe(4);
  });
  it("rejects partial or inconsistent aggregates", () => {
    const row = {
      week_start: "2026-10-12",
      opened: 2,
      answered: 1,
      overview_counts: [0, 0, 0, 1, 0],
      relief_counts: [0, 0, 0, 0, 1],
      burden_counts: [1, 0, 0, 0, 0],
    };
    expect(pulseStatsSchema.safeParse([row]).success).toBe(true);
    expect(pulseStatsSchema.safeParse([{ ...row, opened: 0 }]).success).toBe(false);
    expect(pulseStatsSchema.safeParse([{ ...row, burden_counts: [1, 1, 0, 0, 0] }]).success).toBe(
      false,
    );
  });
});
