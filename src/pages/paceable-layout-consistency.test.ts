import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Static presentation guardrails. These are not screenshots or proof of
 * physical-device readability; they prevent known source-level regressions.
 */
const source = (path: string) => readFileSync(path, "utf8");

describe("Paceable cross-view layout consistency", () => {
  it("gives Energy Map choices enough width on narrow screens without losing their labels", () => {
    const view = source("src/pages/energy-map.tsx");
    expect(view).toContain("grid-cols-[repeat(auto-fit,minmax(min(100%,5.5rem),1fr))]");
    expect(view).toContain('className="text-center text-xs leading-snug break-words"');
    expect(view).toContain("aria-pressed={active}");
    expect(view).not.toContain('className="grid grid-cols-5 gap-2"');
  });

  it("names the mood pattern tool consistently with Paceable, not retired Flow branding", () => {
    const mood = source("src/pages/mood.tsx");
    const dialog = source("src/components/flow-insights-modal.tsx");
    expect(mood).toContain('t("Se mina mönster")');
    expect(dialog).toContain("Se mina mönster");
    expect(mood).not.toContain("Hitta mitt flow");
    expect(dialog).not.toContain("Hitta mitt flow");
  });

  it("uses theme-aware surfaces for ordinary mood, private notes and invisible-work rows", () => {
    const mood = source("src/pages/mood.tsx");
    const notes = source("src/components/day/day-space-note.tsx");
    const invisible = source("src/components/day/invisible-work-today.tsx");
    expect(mood).toContain("bg-card/75");
    expect(notes).toContain("border-border/70 bg-card/80");
    expect(notes).toContain("bg-card/70 text-muted-foreground");
    expect(invisible).toContain("bg-card/85");
    expect(invisible).toContain("bg-card/75");
    // The existing warm apricot area remains intentionally area-specific.
    expect(invisible).toContain('bg-[#F8ECE6]');
    for (const view of [mood, notes, invisible]) {
      expect(view).not.toMatch(/\bbg-white\/(?:50|60|65|70|75|80)\b/);
    }
  });

  it("keeps energy journey overlays theme-aware and close controls large enough to tap", () => {
    const journey = source("src/components/day-edges-checkin.tsx");
    expect(journey).toContain("bg-card/75");
    expect(journey).toContain("bg-card/70");
    expect(journey).toContain("min-h-11 min-w-11");
    expect(journey).toContain("min-h-11 rounded-xl bg-secondary/70");
    expect(journey).not.toContain("min-h-9 rounded-xl bg-[#F5EDF7]");
  });

  it("retains the existing shared compact page header and readable card CSS", () => {
    const header = source("src/components/paceable/page-header.tsx");
    const css = source("src/styles.css");
    expect(header).toContain("pace-standard-header");
    // Existing newer card layout already removes legacy one-line clipping.
    expect(css).toContain("html[data-pace-refresh=\"true\"] .pace-block-header :is(h2, p, [class*=\"line-clamp\"])");
    expect(css).toContain("-webkit-line-clamp: unset");
    expect(css).toContain("html[data-pace-refresh=\"true\"] [data-pace-block]");
  });
});
