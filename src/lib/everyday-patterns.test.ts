import { describe, expect, it } from "vitest";
import {
  activityKeywords,
  buildEverydayPatterns,
  everydayPatternLines,
} from "@/lib/everyday-patterns";

const NOW = new Date("2026-09-04T10:00:00.000Z");
const iso = (daysAgo: number) =>
  new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);

describe("everyday-patterns", () => {
  it("säger ingenting utan underlag", () => {
    const p = buildEverydayPatterns({ activities: [], energy: [], now: NOW });
    expect(p.ready).toBe(false);
    expect(p.busiest).toBeNull();
    expect(p.draining).toBeNull();
  });

  it("hittar veckodagen med mest på schemat", () => {
    const activities: { title: string; date: string }[] = [];
    for (let week = 0; week < 6; week++) {
      // 2026-09-04 är en fredag → 7*week ger fredagar.
      for (let i = 0; i < 4; i++) {
        activities.push({ title: `Sak ${i}`, date: iso(7 * week) });
      }
      activities.push({ title: "Lugnt", date: iso(7 * week + 2) });
    }
    const p = buildEverydayPatterns({ activities, energy: [], now: NOW });
    expect(p.busiest?.label).toBe("fredagar");
    expect(p.busiest!.average).toBeGreaterThan(p.busiest!.overall);
    expect(everydayPatternLines(p)[0]).toContain("fredagar");
  });

  it("hittar aktiviteter som brukar ta energi", () => {
    const activities = [
      { title: "Tvätta barnens kläder", date: iso(1) },
      { title: "Tvätta mattor", date: iso(3) },
      { title: "Tvätta bilen", date: iso(5) },
      { title: "Fika med Anna", date: iso(2) },
      { title: "Promenad", date: iso(4) },
      { title: "Läsa bok", date: iso(6) },
    ];
    const energy = [
      { level: 2, loggedAt: `${iso(1)}T18:00:00.000Z` },
      { level: 2, loggedAt: `${iso(3)}T18:00:00.000Z` },
      { level: 2, loggedAt: `${iso(5)}T18:00:00.000Z` },
      { level: 4, loggedAt: `${iso(2)}T18:00:00.000Z` },
      { level: 4, loggedAt: `${iso(4)}T18:00:00.000Z` },
      { level: 5, loggedAt: `${iso(6)}T18:00:00.000Z` },
    ];
    const p = buildEverydayPatterns({ activities, energy, now: NOW });
    expect(p.draining?.label).toBe("tvätta");
    expect(p.draining!.average).toBeLessThan(p.draining!.baseline);
    expect(p.ready).toBe(true);
  });

  it("plockar bort småord ur rubriker", () => {
    expect(activityKeywords("Handla mat till helgen")).toEqual(["handla", "helgen"]);
  });
});
