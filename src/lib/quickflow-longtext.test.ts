import { describe, expect, it } from "vitest";
import { looksLikeLongNote, suggestNoteTitle, wordCount } from "./quickflow-longtext";

describe("looksLikeLongNote", () => {
  it("ser inte en kort uppgift som anteckning", () => {
    expect(looksLikeLongNote("Ring tandläkaren")).toBe(false);
  });

  it("ser inte en lista med flera saker som anteckning", () => {
    expect(
      looksLikeLongNote("Ring tandläkaren, köp presenter, boka tvättid och skicka mejlet"),
    ).toBe(false);
  });

  it("känner igen en längre tanketömning", () => {
    const text =
      "Jag känner att jag verkligen behöver få ordning på allt hemma. Det är så mycket som snurrar i huvudet just nu och jag behöver fundera på hur vi ska få till rutinerna framöver.";
    expect(looksLikeLongNote(text)).toBe(true);
  });

  it("hanterar tom text", () => {
    expect(looksLikeLongNote("   ")).toBe(false);
  });
});

describe("suggestNoteTitle", () => {
  it("tar första meningen", () => {
    expect(suggestNoteTitle("Ordning hemma. Sen resten av tanken.")).toBe("Ordning hemma.");
  });

  it("kortar långa meningar", () => {
    const title = suggestNoteTitle("a".repeat(200));
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(61);
  });
});

describe("wordCount", () => {
  it("räknar ord", () => {
    expect(wordCount(" ett två  tre ")).toBe(3);
  });
});
