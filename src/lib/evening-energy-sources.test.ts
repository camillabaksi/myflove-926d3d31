import { describe, expect, it } from "vitest";
import { eveningEnergySourceKey, pendingEveningEnergySources } from "./evening-energy-sources";

describe("evening reflection reuses the day's already registered energy", () => {
  it("does not register a source twice if it was already logged today", () => {
    const logged = [{ title: "Naturen", direction: "gives" }];
    expect(pendingEveningEnergySources(["Naturen", "En paus"], logged)).toEqual(["En paus"]);
  });

  it("keeps both-direction energy observations without creating another positive entry", () => {
    expect(pendingEveningEnergySources(["MUSIK", " promenad "], [
      { title: "musik", direction: "both" },
      { title: "Promenad", direction: "drains" },
    ])).toEqual(["promenad"]);
  });

  it("deduplicates case, Swedish letters, whitespace and custom text in the same save", () => {
    expect(eveningEnergySourceKey("  LUGN   och RO  ")).toBe("lugn och ro");
    expect(pendingEveningEnergySources(["Lugn och ro", "  lugn   och ro ", "Återhämtning", "återhämtning"], []))
      .toEqual(["Lugn och ro", "Återhämtning"]);
  });

  it("does not reinsert already confirmed rows after a partial network failure", () => {
    const confirmed = new Set([eveningEnergySourceKey("En paus")]);
    expect(pendingEveningEnergySources(["En paus", "Naturen"], [], confirmed)).toEqual(["Naturen"]);
    expect(pendingEveningEnergySources(["En paus"], [], confirmed)).toEqual([]);
  });

  it("omits empty entries and never edits the input history", () => {
    const recorded = [{ title: "Skogen", direction: "gives" }];
    expect(pendingEveningEnergySources([" ", "Skogen", "Varm dusch"], recorded)).toEqual(["Varm dusch"]);
    expect(recorded).toEqual([{ title: "Skogen", direction: "gives" }]);
  });
});
