import { describe, expect, it } from "vitest";

import { buildFamilyLoad, familyLoadContext, familyPatternNote, itemMinutes } from "@/lib/family-load";

const base = { childName: "Bianca" };

describe("familjens belastning", () => {
  it("räknar bara det som kräver föräldern", () => {
    const load = buildFamilyLoad({
      items: [
        { ...base, time: "08:00", title: "Skola", requiresParent: false },
        { ...base, time: "16:00", title: "Tandläkare", requiresParent: true },
      ],
      capacity: "medel",
      nowMinutes: 7 * 60,
    });
    expect(load.requiring).toBe(1);
    expect(load.upcoming).toHaveLength(1);
  });

  it("saknad markering räknas inte som att den gäller föräldern", () => {
    const load = buildFamilyLoad({
      items: [{ ...base, time: "15:00", title: "Träning" }],
      capacity: "medel",
      nowMinutes: 10 * 60,
    });
    expect(load.requiring).toBe(0);
  });

  it("lägger till förberedelse och resa i tiden", () => {
    expect(
      itemMinutes({ ...base, title: "Tandläkare", time: "16:00", endTime: "17:00", prepMinutes: 10, travelMinutes: 15 }),
    ).toBe(85);
    expect(itemMinutes({ ...base, title: "Hämtning", time: "16:00" })).toBe(0);
  });

  it("låg kapacitet gör en enda aktivitet krävande", () => {
    const load = buildFamilyLoad({
      items: [{ ...base, time: "16:00", title: "Tandläkare", requiresParent: true }],
      capacity: "låg",
      nowMinutes: 12 * 60,
      batteryPercent: 20,
    });
    expect(load.demanding).toBe(true);
    expect(load.summaryLine).toContain("Kapacitetsläge: Lågt");
  });

  it("ger ingen kontext när inget återstår", () => {
    const load = buildFamilyLoad({ items: [], capacity: "hög", nowMinutes: 600 });
    expect(load.demanding).toBe(false);
    expect(familyLoadContext(load)).toBeNull();
  });

  it("sätter aldrig energivärden i kontexten", () => {
    const load = buildFamilyLoad({
      items: [{ ...base, time: "16:00", title: "Tandläkare", requiresParent: true, travelMinutes: 15, recoveryAfter: true }],
      capacity: "medel",
      nowMinutes: 600,
    });
    const text = familyLoadContext(load) ?? "";
    expect(text).toContain("resa 15 min");
    expect(text).toContain("Sätt aldrig energivärden");
    expect(text).not.toMatch(/-\d+ ?%/);
  });

  it("mönster nämns bara när användaren loggat tillräckligt", () => {
    expect(familyPatternNote({ drains: 1, logged: 2 })).toBeNull();
    expect(familyPatternNote({ drains: 1, logged: 5 })).toBeNull();
    expect(familyPatternNote({ drains: 4, logged: 5 })).toContain("Du har tidigare loggat");
  });
});
