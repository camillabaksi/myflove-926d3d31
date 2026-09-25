import { describe, it, expect } from "vitest";
import { DEFAULT_PREFS, HOME_BLOCKS, cleanupOrder, type HomeBlockId } from "@/lib/home-layout";

describe("hemskärmens standardlayout (fyra fasta widgets)", () => {
  const visible = DEFAULT_PREFS.order.filter((id) => !DEFAULT_PREFS.hidden.includes(id));

  it("visar inte Barnens dag innan användaren själv väljer det", () => {
    expect(DEFAULT_PREFS.hidden).toContain("barnens-dag");
    expect(visible).not.toContain("barnens-dag");
  });

  it("har bara sekundära block kvar – de fyra widgetarna är fasta och bor i home.tsx", () => {
    const ids = HOME_BLOCKS.map((b) => b.id as string);
    expect(ids).not.toContain("batteri");
    expect(ids).not.toContain("forslag");
    expect(ids).not.toContain("idag");
    expect(ids).not.toContain("lagg-till");
    expect(ids).not.toContain("vagar");
    expect(ids).not.toContain("genvagar");
  });

  it("har inga energidubbletter kvar – de bor i Mitt batteri", () => {
    const ids = HOME_BLOCKS.map((b) => b.id as string);
    expect(ids).not.toContain("checkin");
    expect(ids).not.toContain("energifloede");
  });

  it("filtrerar bort okända block ur en gammal sparad ordning", () => {
    const gammal = ["omrade", "idag", "batteri", "vagar", "medicin"] as HomeBlockId[];
    const sorterad = cleanupOrder(gammal);
    expect(sorterad).toEqual(["medicin", "omrade"]);
    expect(sorterad).not.toContain("idag");
  });
});
