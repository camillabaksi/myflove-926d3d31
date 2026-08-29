import { describe, it, expect } from "vitest";
import { DEFAULT_PREFS, HOME_BLOCKS, cleanupOrder, type HomeBlockId } from "@/lib/home-layout";

describe("hemskärmens standardlayout (samlad överblick)", () => {
  const visible = DEFAULT_PREFS.order.filter((id) => !DEFAULT_PREFS.hidden.includes(id));

  it("visar alla hemblock som standard – inget innehåll göms bort", () => {
    expect(visible).toHaveLength(HOME_BLOCKS.length);
  });

  it("prioriterar energi, rekommendation, nästa, dagen och infångning", () => {
    expect(visible.slice(0, 5)).toEqual(["batteri", "forslag", "nasta", "idag", "lagg-till"]);
  });

  it("har inget genvägsblock kvar", () => {
    expect(HOME_BLOCKS.some((b) => (b.id as string) === "genvagar")).toBe(false);
  });

  it("har inga energidubbletter kvar – de bor i Mitt batteri", () => {
    const ids = HOME_BLOCKS.map((b) => b.id as string);
    expect(ids).not.toContain("checkin");
    expect(ids).not.toContain("energifloede");
  });

  it("sorterar en gammal ordning till Clean-up-ordningen", () => {
    const gammal = ["omrade", "idag", "batteri"] as HomeBlockId[];
    const sorterad = cleanupOrder(gammal);
    expect(sorterad.indexOf("batteri")).toBeLessThan(sorterad.indexOf("idag"));
    expect(sorterad.indexOf("idag")).toBeLessThan(sorterad.indexOf("omrade"));
    expect(sorterad).toHaveLength(HOME_BLOCKS.length);
  });
});
