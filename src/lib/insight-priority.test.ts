import { describe, expect, it } from "vitest";
import type { PersonalInsight } from "@/lib/insight-personal";
import { insightEvidenceLabel, prioritizedInsights } from "./insight-priority";

const insight = (id: string, confidence: PersonalInsight["confidence"]): PersonalInsight =>
  ({ id, text: id, confidence });

describe("calm, evidence-led Insight priority", () => {
  it("features the strongest observation and keeps every lower-confidence insight", () => {
    const ordered = prioritizedInsights([
      insight("a", "börjar"), insight("b", "ser"), insight("c", "vet"), insight("d", "ser"),
    ]);
    expect(ordered.map(row => row.id)).toEqual(["c", "b", "d", "a"]);
  });

  it("maintains original order within each evidence level", () => {
    expect(prioritizedInsights([insight("a", "ser"), insight("b", "ser")]).map(x => x.id))
      .toEqual(["a", "b"]);
  });

  it("does not invent certainty or alter the provided data", () => {
    const original = [insight("a", "börjar")];
    const prioritized = prioritizedInsights(original);
    expect(prioritized).toEqual(original);
    expect(original).toHaveLength(1);
    expect(insightEvidenceLabel("börjar")).toMatch(/Tidig observation/);
    expect(insightEvidenceLabel("ser")).toMatch(/möjligt mönster/);
    expect(insightEvidenceLabel("vet")).toMatch(/registreringar/);
  });

  it("stays empty until real personal insights are available", () => {
    expect(prioritizedInsights([])).toEqual([]);
  });
});
