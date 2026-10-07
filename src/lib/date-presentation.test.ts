import { describe, expect, it } from "vitest";
import { dateHeadingLabel } from "./date-presentation";
describe("date heading presentation", () => {
  it("capitalizes only the start of a Swedish date", () => {
    const label = new Date("2026-10-07T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
    expect(dateHeadingLabel(label, "sv-SE")).toBe("Onsdag 7 oktober");
    expect(dateHeadingLabel("onsdag 7 oktober", "sv")).toBe("Onsdag 7 oktober");
  });
  it("preserves other locale casing and empty labels", () => {
    expect(dateHeadingLabel("Wednesday, October 7", "en-US")).toBe("Wednesday, October 7");
    expect(dateHeadingLabel("mercredi 7 octobre", "fr-FR")).toBe("mercredi 7 octobre");
    expect(dateHeadingLabel("", "sv-SE")).toBe("");
  });
});
