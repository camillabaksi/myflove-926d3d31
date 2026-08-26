import { describe, it, expect } from "vitest";
import { DEFAULT_PREFS, HOME_BLOCKS, cleanupOrder, type HomeBlockId } from "@/lib/home-layout";

describe("hemskärmens standardlayout (Clean-up 1.0)", () => {
  const visible = DEFAULT_PREFS.order.filter((id) => !DEFAULT_PREFS.hidden.includes(id));

  it("visar högst sex block som standard", () => {
    expect(visible.length).toBeLessThanOrEqual(6);
  });

  it("prioriterar energi, rekommendation, nästa, dagen och infångning", () => {
    expect(visible).toEqual(["batteri", "forslag", "nasta", "idag", "lagg-till"]);
  });

  it("har inget genvägsblock kvar", () => {
    expect(HOME_BLOCKS.some((b) => (b.id as string) === "genvagar")).toBe(false);
  });

  it("sorterar en gammal ordning till Clean-up-ordningen", () => {
    const gammal = ["omrade", "idag", "batteri"] as HomeBlockId[];
    const sorterad = cleanupOrder(gammal);
    expect(sorterad.indexOf("batteri")).toBeLessThan(sorterad.indexOf("idag"));
    expect(sorterad.indexOf("idag")).toBeLessThan(sorterad.indexOf("omrade"));
    expect(sorterad).toHaveLength(HOME_BLOCKS.length);
  });
});
