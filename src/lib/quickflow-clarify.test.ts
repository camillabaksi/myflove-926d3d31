import { describe, expect, it } from "vitest";
import { guessEnergyLevel, heuristicClarify } from "./quickflow-clarify";

describe("quickflow clarification", () => {
  it("estimates energy from familiar task words", () => {
    expect(guessEnergyLevel("Diska")) toBe("liten");
    expect(guessEnergyLevel("Städa hela förrådet")) toBe("stor");
    expect(guessEnergyLevel("Svara läraren")) toBe("liten");
  });

  it("keeps the fallback supportive and non-directive", () => {
    const result = heuristicClarify("Handla", 25);
    expect(result.why).toBeTruthy();
    expect(result.energyNote).toContain("snabbt");
    expect(result.firstStep).toContain("handla");
  });
});
