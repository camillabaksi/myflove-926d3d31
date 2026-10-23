import { describe, expect, it } from "vitest";
import { navigationLabel, plainLabel } from "./npf-mode";
import { translate } from "./i18n";

describe("Stable main navigation destination labels", () => {
  it.each([true, false])("keeps the capture destination recognisable with plain words %s", (plain) => {
    expect(navigationLabel("/quickflow", "Fånga", plain)).toBe("Fånga");
    expect(navigationLabel("/quickflow", "Skriv av dig", plain)).toBe("Fånga");
    expect(translate(navigationLabel("/quickflow", "Fånga", plain), "en")).toBe("Capture");
  });
  it("leaves descriptive subpages and other plain-word choices intact", () => {
    expect(plainLabel("Fånga", true)).toBe("Skriv av dig");
    expect(navigationLabel("/flowplan", "Planering", true)).toBe("Ordning på dagen");
  });
});