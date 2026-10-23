import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (page: string) =>
  readFileSync(`src/pages/${page}.tsx`, "utf8");

describe("Paceable secondary-page mobile layout contracts", () => {
  it("lets pause presets wrap with available width and larger system text", () => {
    const page = source("pause");
    expect(page).toContain("grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))]");
    expect(page).toContain("pace-compact-control min-w-0 whitespace-normal");
    expect(page).not.toContain("grid grid-cols-3 gap-2 sm:grid-cols-5");
    // Every existing preset retains the original action and selected state.
    expect(page).toContain("onClick={() => startPause(m)}");
    expect(page).toContain('variant={m === minutes ? "default" : "secondary"}');
  });

  it("preserves the normal two-to-three stat layout but allows a single column when text needs more space", () => {
    for (const pageName of ["finances", "energy-flow"]) {
      const page = source(pageName);
      expect(page).toContain("grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))]");
      expect(page).toContain("sm:grid-cols-3");
      // The third total/balance row spans the actual mobile grid even when
      // auto-fit collapses to just one column.
      expect(page).toContain('className="col-span-full sm:col-span-1"');
      expect(page).not.toContain('className="col-span-2 sm:col-span-1"');
    }
  });

  it("uses semantic background tokens instead of an old fixed light lavender on health surfaces", () => {
    for (const pageName of ["energy-map", "mood"]) {
      const page = source(pageName);
      expect(page).not.toContain("bg-[#F5EDF7]");
      expect(page).toContain("bg-secondary/30");
      // No changes to the data sources or existing active save handlers.
      expect(page).toContain("CollapsibleSection");
    }
  });
});
