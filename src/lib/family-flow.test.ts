import { describe, expect, it } from "vitest";

import {
  detectMinutesUntil,
  familyTaskTitle,
  planFamilySituation,
} from "@/lib/family-flow";

describe("family-flow", () => {
  it("hittar hur lång tid som är kvar", () => {
    expect(detectMinutesUntil("vi ska gå om 20 minuter")).toBe(20);
    expect(detectMinutesUntil("om en halvtimme")).toBe(30);
    expect(detectMinutesUntil("om 2 timmar")).toBe(120);
    expect(detectMinutesUntil("vi ska städa")).toBeNull();
  });

  it("ger förslag utan energidata (neutral fallback)", () => {
    const s = planFamilySituation({ text: "Vi behöver städa", subject: "familjen" });
    expect(s.usedFallback).toBe(true);
    expect(s.steps.length).toBeGreaterThan(0);
  });

  it("använder barnets sparade observationer", () => {
    const s = planFamilySituation({
      text: "Jag måste få Bianca klar till skolan, vi ska gå om 25 minuter",
      subject: "barn",
      childName: "Bianca",
      helps: ["Extra tid vid övergångar"],
      score: 55,
    });
    expect(s.timingLine).toContain("25");
    expect(s.helpLine).toBe("Bianca brukar behöva extra tid vid övergångar.");
    expect(s.steps[0]).toContain("extra minuter");
  });

  it("mjuknar förslaget vid låg kapacitet", () => {
    const s = planFamilySituation({ text: "Vi ska till läkaren 14:00", subject: "familjen", score: 20 });
    expect(s.headline).toBe("Vi gör det här mindre.");
    expect(s.capacityNote).not.toBeNull();
    expect(s.fixedTime).toBe("14:00");
    expect(s.suggestRecovery).toBe(true);
  });

  it("håller hög kapacitet utan förenklingsnotis", () => {
    const s = planFamilySituation({ text: "Städa tillsammans", subject: "familjen", score: 80 });
    expect(s.capacityNote).toBeNull();
  });

  it("märker titeln med vem det gäller", () => {
    expect(familyTaskTitle("gå till tandläkaren", "barn", "Cassandra")).toBe(
      "Gå till tandläkaren (Cassandra)",
    );
    expect(familyTaskTitle("träna", "jag")).toBe("Träna");
  });
});
