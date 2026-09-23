import { describe, expect, it } from "vitest";

import { buildRecoveryGaps, findGaps, optionsForGap, type FixedSlot } from "@/lib/recovery-gaps";

const DAY: FixedSlot[] = [
  { start: "08:00", end: "16:00", title: "Jobb" },
  { start: "16:30", end: "16:50", title: "Hämta barn" },
  { start: "17:00", end: "18:00", title: "Barnets träning", who: "familj" },
  { start: "18:30", end: "19:00", title: "Middag" },
  { start: "19:30", end: "20:00", title: "Kvällsrutin" },
];

describe("findGaps", () => {
  it("hittar luckor mellan fasta aktiviteter", () => {
    const gaps = findGaps(DAY, {
      startMinutes: 7 * 60,
      endMinutes: 22 * 60,
      nowMinutes: 7 * 60,
      bufferMinutes: 0,
    });
    const labels = gaps.map((g) => `${g.start}-${g.end}`);
    expect(labels).toContain(`${16 * 60}-${16 * 60 + 30}`);
    expect(labels).toContain(`${19 * 60}-${19 * 60 + 30}`);
  });

  it("respekterar restid/förberedelse som upptagen tid", () => {
    const gaps = findGaps(DAY, {
      startMinutes: 7 * 60,
      endMinutes: 22 * 60,
      nowMinutes: 7 * 60,
      bufferMinutes: 10,
    });
    expect(gaps.every((g) => g.end - g.start >= 10)).toBe(true);
    // 16:00–16:30 krymper till 16:10–16:20 med buffert.
    expect(gaps.some((g) => g.start === 16 * 60 + 10 && g.end === 16 * 60 + 20)).toBe(true);
  });

  it("ger inga luckor när dagen är helt full", () => {
    const full: FixedSlot[] = [{ start: "07:00", end: "22:00", title: "Allt" }];
    expect(
      findGaps(full, { startMinutes: 7 * 60, endMinutes: 22 * 60, nowMinutes: 7 * 60 }),
    ).toHaveLength(0);
  });

  it("räknar inte tid som redan passerat", () => {
    const gaps = findGaps(DAY, {
      startMinutes: 7 * 60,
      endMinutes: 22 * 60,
      nowMinutes: 20 * 60,
      bufferMinutes: 0,
    });
    expect(gaps.every((g) => g.start >= 20 * 60)).toBe(true);
  });
});

describe("optionsForGap", () => {
  it("föreslår bara sådant som får plats", () => {
    for (const gap of [10, 20, 45]) {
      for (const cap of ["låg", "medel", "hög"] as const) {
        const options = optionsForGap(gap, cap);
        expect(options.length).toBeGreaterThan(0);
        expect(options.every((o) => o.minutes <= gap)).toBe(true);
      }
    }
  });

  it("ger fler alternativ i en längre lucka", () => {
    expect(optionsForGap(45, "medel").length).toBeGreaterThan(optionsForGap(10, "medel").length);
  });

  it("låg kapacitet ger kort och lågtröskligt först", () => {
    expect(optionsForGap(20, "låg")[0]?.minutes).toBeLessThanOrEqual(10);
  });

  it("använder det användaren loggat som energigivande", () => {
    const options = optionsForGap(30, "hög", "Promenad");
    expect(options.map((o) => o.label)).toContain("Promenad");
  });
});

describe("buildRecoveryGaps", () => {
  const base = { slots: DAY, dayStart: "07:00", dayEnd: "22:00", nowMinutes: 7 * 60 };

  it("låg kapacitet + full dag ger korta förslag", () => {
    const r = buildRecoveryGaps({ ...base, score: 18 });
    expect(r.capacity).toBe("låg");
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.gaps.every((g) => g.minutes <= 20)).toBe(true);
  });

  it("medel och hög kapacitet ger också förslag", () => {
    expect(buildRecoveryGaps({ ...base, score: 50 }).gaps.length).toBeGreaterThan(0);
    expect(buildRecoveryGaps({ ...base, score: 80 }).capacity).toBe("hög");
  });

  it("utan energidata används medel som fallback", () => {
    const r = buildRecoveryGaps({ ...base, score: null });
    expect(r.capacity).toBe("medel");
    expect(r.usedFallback).toBe(true);
  });

  it("säger något varmt när ingen lucka finns", () => {
    const r = buildRecoveryGaps({
      ...base,
      slots: [{ start: "07:00", end: "22:00", title: "Allt" }],
      score: 30,
    });
    expect(r.gaps).toHaveLength(0);
    expect(r.emptyNote).toBeTruthy();
  });

  it("formulerar tidigare loggar som observation, inte sanning", () => {
    const r = buildRecoveryGaps({ ...base, score: 60, energyBoostTitle: "Promenad" });
    expect(r.preferenceNote).toContain("har du loggat");
  });
});
