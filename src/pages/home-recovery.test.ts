import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Återhämtning måste gå att nå från Hem även i lågt kapacitetsläge.
 * (Hemsidan har för många beroenden för ett snabbt renderingstest; den
 * visuella kontrollen görs i mobilvy.)
 */
describe("Hem i lågt läge", () => {
  it("visar länken till Återhämtning utan villkor på kapacitetsläget", () => {
    const src = readFileSync(join(process.cwd(), "src/pages/home.tsx"), "utf8");
    const i = src.indexOf('href="/aterhamtning"');
    expect(i).toBeGreaterThan(0);
    const before = src.slice(Math.max(0, i - 400), i);
    expect(before).not.toMatch(/!isLowCapacity\s*&&\s*<div/);
  });
});
