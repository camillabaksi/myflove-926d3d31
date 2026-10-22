import { describe, expect, it } from "vitest";
import { hourlyEnergyProfile } from "./hourly-energy-profile";

describe("Battery's hourly energy profile", () => {
  it("preserves all real clock hours so missing readings are never zero", () => {
    const result = hourlyEnergyProfile([
      { level: 3, logged_at: "2026-10-20T05:30:00+02:00" },
      { level: 4, logged_at: "2026-10-20T22:15:00+02:00" },
    ]);
    expect(result.hours).toHaveLength(24);
    expect(result.hours[5]).toMatchObject({ hour: "05:00", avg: 3, n: 1 });
    expect(result.hours[22]).toMatchObject({ hour: "22:00", avg: 4, n: 1 });
    expect(result.hours[6]).toMatchObject({ hour: "06:00", avg: null, n: 0 });
    expect(result.hours[12]).toMatchObject({ hour: "12:00", avg: null, n: 0 });
  });

  it("does not claim typical peaks from seven logs all on the same day", () => {
    const result = hourlyEnergyProfile(Array.from({ length: 7 }, (_, index) => ({
      level: index % 2 ? 2 : 5,
      logged_at: `2026-10-20T${index % 2 ? "08" : "14"}:00:00+02:00`,
    })));
    expect(result.observedDays).toBe(1);
    expect(result.supportedPattern).toBe(false);
    expect(result.peak).toBeNull();
    expect(result.low).toBeNull();
  });

  it("only offers tentative patterns after repeated hours across multiple dates", () => {
    const logs = [20, 21, 22].flatMap(day => [
      { level: 4, logged_at: `2026-10-${day}T14:00:00+02:00` },
      { level: 2, logged_at: `2026-10-${day}T16:00:00+02:00` },
    ]);
    const result = hourlyEnergyProfile(logs);
    expect(result.observedDays).toBe(3);
    expect(result.supportedPattern).toBe(true);
    expect(result.peak?.hour).toBe("14:00");
    expect(result.low?.hour).toBe("16:00");
    expect(result.hours[12]?.avg).toBeNull();
  });

  it("ignores invalid samples rather than treating them as a very low-energy hour", () => {
    const result = hourlyEnergyProfile([
      { level: Number.NaN, logged_at: "2026-10-22T10:00:00+02:00" },
      { level: 0, logged_at: "2026-10-22T11:00:00+02:00" },
      { level: 3, logged_at: "not-a-date" },
    ]);
    expect(result.observedDays).toBe(0);
    expect(result.hours.every(row => row.avg === null)).toBe(true);
  });
});
