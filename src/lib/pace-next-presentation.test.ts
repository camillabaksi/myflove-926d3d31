import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("next-page presentation safeguards", () => {
  it("opts in only the three approved pages, not Today or More", () => {
    for (const path of ["src/components/calendar/calendar-planner.tsx", "src/pages/dump.tsx", "src/pages/health.tsx"]) {
      expect(readFileSync(path, "utf8")).toContain("pace-next-page");
    }
    for (const path of ["src/pages/today.tsx", "src/components/paceable/more-view.tsx"]) {
      expect(readFileSync(path, "utf8")).not.toContain("pace-next-page");
    }
  });
  it("retains actual 44px control boxes without changing global color tokens", () => {
    const css = readFileSync("src/styles.css", "utf8").split("/* Next-page opt-in:")[1];
    expect(css).toContain("min-height: 44px; min-width: 44px");
    expect(css).toContain("background-clip: padding-box");
    expect(css).toContain("pointer-events: none");
    expect(css).not.toMatch(/--(?:primary|foreground|ink):/);
    expect(css).not.toContain("pace-calendar-timeline");
  });
  it("preserves default import appearance and existing entry destinations", () => {
    const source = readFileSync("src/components/quickflow-image-import.tsx", "utf8");
    expect(source).toContain('appearance = "default"');
    expect(source).toContain("onClick={() => setOpen(true)}");
    expect(source).toContain("onClick={() => docRef.current?.click()}");
    const place = readFileSync("src/pages/health.tsx", "utf8");
    for (const path of ["/mitt-batteri", "/aterhamtning", "/assistant"]) expect(place).toContain(`href="${path}"`);
  });
});