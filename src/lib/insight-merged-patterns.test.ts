import { describe, expect, it } from "vitest";
import { mergedInsightPatterns } from "./insight-merged-patterns";
import type { PersonalInsight } from "./insight-personal";
import type { WeekdayLoad } from "./everyday-patterns";

const label = () => "En försiktig observation";
const day = (weekday: number, name: string, average: number): WeekdayLoad => ({
  weekday, label: name, average, overall: 1,
});

describe("merged Insight patterns", () => {
  it("combines remaining personal observations and supported schedule patterns in one list", () => {
    const personal: PersonalInsight[] = [
      { id: "mornings", confidence: "ser", text: "Morgnarna verkar ofta fungera." },
      { id: "evenings", confidence: "börjar", text: "Kvällarna behöver mer underlag." },
    ];
    const merged = mergedInsightPatterns(personal, {
      busiest: day(1, "måndagar", 3.4),
      calmest: day(3, "onsdagar", 0.5),
    }, label);
    expect(merged).toHaveLength(4);
    expect(merged.map(p => p.id)).toEqual([
      "observed-mornings", "observed-evenings", "planned-busiest", "planned-calmest",
    ]);
    expect(merged[2].text).toContain("planerade aktiviteter");
    expect(merged[2].context).toContain("inte bekräftat genomförande");
    expect(merged.map(x => x.text).join(" ")).not.toMatch(/tar energi|orsaka|återhämtning/);
  });

  it("never repeats identical insights or a weekday that is both busiest and calmest", () => {
    const sample: PersonalInsight[] = [
      { id: "a", confidence: "ser", text: "Ett möjligt mönster" },
      { id: "b", confidence: "vet", text: "  ett  möjligt  mönster  " },
    ];
    const merged = mergedInsightPatterns(sample, {
      busiest: day(5, "fredagar", 3),
      calmest: day(5, "fredagar", 0.5),
    }, label);
    expect(merged).toHaveLength(2);
  });

  it("does not invent energy causation when only plans correlate with low check-ins", () => {
    const merged = mergedInsightPatterns([], { busiest: null, calmest: null }, label);
    expect(merged).toEqual([]);
  });
});
