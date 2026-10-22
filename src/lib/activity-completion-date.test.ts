import { describe, expect, it } from "vitest";
import { dayOf } from "@/lib/day";
import { energyOccurredAtForDay, initialActualDate } from "./activity-completion-date";

const now = new Date("2026-10-22T14:09:00+02:00");

describe("Actual completion date versus planned date", () => {
  it("defaults an overdue activity to its planned day, without choosing today's battery", () => {
    expect(initialActualDate("2026-10-21", undefined, now)).toBe("2026-10-21");
    const occurredAt = energyOccurredAtForDay("2026-10-21", undefined, now);
    expect(dayOf(occurredAt)).toBe("2026-10-21");
    expect(occurredAt).not.toEqual(now.toISOString());
  });

  it("allows 'I did it today' even if the plan was yesterday", () => {
    expect(dayOf(energyOccurredAtForDay("2026-10-22", undefined, now))).toBe("2026-10-22");
    expect(energyOccurredAtForDay("2026-10-22", undefined, now)).toBe(now.toISOString());
  });

  it("keeps earlier saved time when editing that observation without changing its date", () => {
    const old = "2026-10-22T12:09:54.916Z";
    expect(initialActualDate("2026-10-21", old, now)).toBe("2026-10-22");
    expect(energyOccurredAtForDay("2026-10-22", old, now)).toBe(old);
    expect(dayOf(energyOccurredAtForDay("2026-10-21", old, now))).toBe("2026-10-21");
  });

  it("never backdates into a future day or invalid date", () => {
    expect(() => energyOccurredAtForDay("2026-10-23", undefined, now)).toThrow();
    expect(() => energyOccurredAtForDay("2026-02-30", undefined, now)).toThrow();
  });

  it("handles the autumn DST change using a valid local date", () => {
    const later = new Date("2026-10-27T12:00:00+01:00");
    expect(dayOf(energyOccurredAtForDay("2026-10-25", undefined, later))).toBe("2026-10-25");
  });
});
