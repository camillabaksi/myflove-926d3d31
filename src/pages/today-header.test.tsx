import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const today = readFileSync("src/pages/today.tsx", "utf8");
const layout = readFileSync("src/components/layout.tsx", "utf8");
const greeting = readFileSync("src/components/day/day-greeting.tsx", "utf8");
const header = readFileSync("src/components/paceable/app-brand-header.tsx", "utf8");

describe("Approved Today-only header boundary", () => {
  it("reuses the shell brand on every route without another Today logo", () => {
    expect(today).not.toContain("BrandLogo");
    expect(layout.match(/<AppBrandHeader /g)).toHaveLength(1);
    expect(header.match(/<BrandLogo /g)).toHaveLength(1);
    expect(layout.match(/<BrandLogo /g)).toHaveLength(1); // desktop; mobile uses the shared header
    expect(layout).not.toContain("w-[220px]");
  });
  it("removes only Today's decorative stones and preserves the existing name menu", () => {
    expect(today).not.toContain("PaceableStones");
    expect(today).toContain('<GreetingNameMenu name={hasChosenName ? name : ""} onSave={saveName} />');
    expect(today).not.toContain("absolute -top-11");
    expect(greeting).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(today).toContain("dateHeadingLabel(dateLabel, locale)");
  });
  it("uses the shared greeting without changing capacity or person selection", () => {
    expect(today).toContain("<DayGreeting");
    expect(today).toContain("<TodayCapacity percent={dayCapacity.percent} />");
    expect(today).toContain('<FamilyDayPerspectives defaultPerspective="me" myDay={<DailyFlowList dayHeadings presentation="integrated" />} />');
  });
});
