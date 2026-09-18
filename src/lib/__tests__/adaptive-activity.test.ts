import { describe, expect, it } from "vitest";

import { adaptActivity, capacityFromScore, detectFixedTime, detectIntent } from "@/lib/adaptive-activity";

describe("adaptive-activity", () => {
  it("känner igen vad användaren vill göra", () => {
    expect(detectIntent("Jag vill träna idag")).toBe("träning");
    expect(detectIntent("Jag behöver plugga till tentan")).toBe("studier");
    expect(detectIntent("Jag måste städa köket")).toBe("städning");
    expect(detectIntent("Jag behöver gå en promenad")).toBe("promenad");
    expect(detectIntent("Ringa försäkringsbolaget")).toBe("generisk");
  });

  it("anpassar omfattningen efter kapaciteten", () => {
    const low = adaptActivity({ text: "Jag vill träna", score: 20 });
    const mid = adaptActivity({ text: "Jag vill träna", score: 50 });
    const high = adaptActivity({ text: "Jag vill träna", score: 85 });
    expect(low.capacity).toBe("låg");
    expect(low.minutes).toBeLessThan(mid.minutes);
    expect(mid.minutes).toBeLessThan(high.minutes);
    expect(low.suggestRecovery).toBe(true);
    expect(high.suggestRecovery).toBe(false);
  });

  it("fungerar utan energidata och nekar aldrig", () => {
    const s = adaptActivity({ text: "Jag behöver städa" });
    expect(s.usedFallback).toBe(true);
    expect(capacityFromScore(null)).toBe("medel");
    expect(s.minutes).toBeGreaterThan(0);
    expect(s.firstStep).toBeTruthy();
  });

  it("låter användaren justera mindre och större", () => {
    const base = adaptActivity({ text: "Jag behöver plugga", score: 50 });
    const smaller = adaptActivity({ text: "Jag behöver plugga", score: 50, adjust: "mindre" });
    const bigger = adaptActivity({ text: "Jag behöver plugga", score: 50, adjust: "större" });
    expect(smaller.minutes).toBeLessThan(base.minutes);
    expect(bigger.minutes).toBeGreaterThan(base.minutes);
  });

  it("rör inte en fast tid", () => {
    expect(detectFixedTime("Jag måste till läkaren 14:00")).toBe("14:00");
    const s = adaptActivity({ text: "Jag måste till läkaren 14:00" });
    expect(s.fixedTime).toBe("14:00");
    expect(s.fixedTimeNote).toContain("14:00");
  });

  it("håller sig inom dagens realistiska fokustid", () => {
    const s = adaptActivity({ text: "Jag vill träna", score: 85, capacityMinutes: 12 });
    expect(s.minutes).toBeLessThanOrEqual(12);
  });
});
