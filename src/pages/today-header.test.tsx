import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const today = readFileSync("src/pages/today.tsx", "utf8");
const layout = readFileSync("src/components/layout.tsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

describe("Approved Today-only header boundary", () => {
  it("reuses the mobile shell logo with a route-specific width, not another page logo", () => {
    expect(today).not.toContain("BrandLogo");
    expect(layout).toContain('location === "/idag" ? "w-[220px] max-w-full" : "mx-auto w-32 max-w-full"');
    expect(layout.match(/<BrandLogo /g)).toHaveLength(2); // desktop + mobile, never simultaneously visible
  });
  it("removes only Today's decorative stones and preserves the existing name menu", () => {
    expect(today).not.toContain("PaceableStones");
    expect(today).toContain('<GreetingNameMenu name={hasChosenName ? name : ""} onSave={saveName} />');
    expect(today).not.toContain("absolute -top-11");
    expect(today).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(today).toContain("dateHeadingLabel(dateLabel, locale)");
  });
  it("scopes the smaller greeting to Today without changing capacity or person selection", () => {
    expect(styles).toContain('[data-paceable-surface="true"] .pace-today-desktop .pace-editorial-greeting { font-size: 2rem; line-height: 1.15; }');
    expect(today).toContain("<TodayCapacity percent={dayCapacity.percent} />");
    expect(today).toContain('<FamilyDayPerspectives defaultPerspective="me" myDay={<DailyFlowList dayHeadings presentation="integrated" />} />');
  });
});