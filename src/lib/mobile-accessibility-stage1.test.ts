import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("Etapp 1 mobil och tillgänglighet", () => {
  it("bottennavigeringen bryts inte till flera rader på smal yta", () => {
    const css = read("src/styles.css");
    const block = css.slice(css.indexOf("@container"), css.length);
    expect(block).not.toMatch(/\.pace-mobile-navigation-items[^{]*\{[^}]*flex-wrap:\s*wrap/);
  });

  it("kalenderns veckolista visar inget streck för poster utan tid", () => {
    const src = read("src/components/calendar/calendar-planner.tsx");
    expect(src).not.toContain('{e.time ?? "—"}');
    expect(src).not.toContain('{entry.time ?? "—"}');
  });

  it("månadsvyn visar antal i stället för •••", () => {
    const src = read("src/components/calendar/calendar-planner.tsx");
    expect(src).not.toContain(">•••<");
    expect(src).toContain("{dayEntries.length} st");
  });

  it("Pace-flikarna klipps inte och har minst 44 px höjd", () => {
    const src = read("src/components/flow/flow-tabs.tsx");
    expect(src).not.toContain('className="truncate"');
    expect(src).toContain("min-h-11");
  });

  it("Fånga, Planera och Veckan på Idag har minst 44 px bredd", () => {
    const src = read("src/pages/today.tsx");
    expect(src.match(/min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-1\.5/g)?.length).toBe(3);
  });
});
