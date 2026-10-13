import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { calendarPictogramsEnabled, MULBERRY_SYMBOLS, mulberryForTitle, mulberrySymbolUrl } from "./mulberry-symbols";

describe("Mulberry calendar support", () => {
  it("resolves specific Swedish actions ahead of broader words", () => {
    expect(mulberryForTitle("Borsta tänderna före skolan")).toBe("teeth");
    expect(mulberryForTitle("Tandläkare")).toBe("dentist");
    expect(mulberryForTitle("Frukost")).toBe("breakfast");
    expect(mulberryForTitle("Fika med Sara")).toBe("coffee");
    expect(mulberryForTitle("Förskola")).toBe("childcare");
    expect(mulberryForTitle("Vila en stund")).toBe("rest");
    expect(mulberryForTitle("Matematik")).toBe("study");
  });
  it("does not invent a specific action for an unfamiliar title", () => {
    expect(mulberryForTitle("Passa på att läsa")).toBe("calendar");
    expect(mulberryForTitle("Automatisering")).toBe("calendar");
    expect(mulberryForTitle("Egen aktivitet", "school")).toBe("school");
  });
  it("honors legacy values and explicit local off over global opt-in", () => {
    expect(calendarPictogramsEnabled(null, true)).toBe(true);
    expect(calendarPictogramsEnabled(null, false)).toBe(false);
    expect(calendarPictogramsEnabled(false, true)).toBe(false);
    expect(calendarPictogramsEnabled(true, false)).toBe(true);
  });
  it("ships every referenced original locally with its license", () => {
    for (const [id, name] of Object.entries(MULBERRY_SYMBOLS)) {
      const url = mulberrySymbolUrl(id as keyof typeof MULBERRY_SYMBOLS)!;
      expect(decodeURIComponent(url)).toBe(`/symbols/mulberry/${name}.svg`);
      expect(existsSync(resolve("public", decodeURIComponent(url).slice(1)))).toBe(true);
    }
    expect(readFileSync("public/symbols/mulberry/README.md", "utf8")).toContain("Steve Lee");
    expect(readFileSync("public/symbols/mulberry/LICENSE.txt", "utf8")).toContain("https://creativecommons.org/licenses/by-sa/4.0/");
  });
});
