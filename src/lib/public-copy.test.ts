import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";
import { LANDING_EN } from "@/lib/landing-translations";
import { currentCopyDictionary, currentProductCopy } from "@/lib/public-copy";
import { plainLabel } from "@/lib/npf-mode";

describe("Current public names and translation compatibility", () => {
  it("keeps existing English translations available under current Swedish names", () => {
    expect(translate("Fråga Pace", "en")).toBe("Ask Pace");
    expect(translate("Prata med Pace", "en")).toBe("Talk to Pace");
    expect(translate("Fråga Flow", "en")).toBe("Ask Pace");
  });

  it("preserves explicit current translations when a legacy alias collides", () => {
    const dictionary = currentCopyDictionary({ Flow: "Old assistant", Pace: "Current assistant" });
    expect(dictionary.Pace).toBe("Current assistant");
    expect(dictionary.Flow).toBe("Old assistant");
  });

  it("retains the public landing's English copy without a translation service", () => {
    const text =
      "Få ner tankar, uppgifter och idéer innan de försvinner. Pace hjälper dig att sortera resten.";
    expect(LANDING_EN[text]).toBe(
      "Capture thoughts, tasks and ideas before they disappear. Pace helps you sort out the rest.",
    );
  });

  it("keeps plain-word accessibility aliases available for renamed functions", () => {
    expect(plainLabel("Planering", true)).toBe("Ordning på dagen");
    expect(plainLabel("Dagens balans", true)).toBe("Hur mycket du orkar");
    expect(plainLabel("Planering", false)).toBe("Planering");
  });

  it("does not rewrite arbitrary Swedish user text through translation", () => {
    const savedText = "Min egen uppgift: Flow är mitt projektnamn";
    expect(translate(savedText, "sv")).toBe(savedText);
  });

  it("leaves compatibility identifiers and action blocks untouched", () => {
    const identifiers = "myflove-energy-log /flowplan /quickflow ```flow-action";
    expect(currentProductCopy(identifiers)).toBe(identifiers);
  });
});
