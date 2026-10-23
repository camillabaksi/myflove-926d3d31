import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Static presentation contract. This targets accidental regressions in the
 * existing page composition without mounting account-owned or health hooks.
 * Real device/zoom screenshots remain an independent visual check.
 */
const pageSource = (name: string) => readFileSync(`src/pages/${name}.tsx`, "utf8");

describe("shared Paceable mobile readability across secondary pages", () => {
  it("lets energy balance labels wrap and keeps the net tile readable on mobile", () => {
    const page = pageSource("energy-flow");
    expect(page).toContain('className="grid grid-cols-2 gap-2 sm:grid-cols-3"');
    expect(page).toContain('className="col-span-2 sm:col-span-1"');
    expect(page).toContain('text-sm font-medium leading-snug text-muted-foreground [overflow-wrap:anywhere]');
    expect(page).not.toContain('truncate text-[11px]');
  });

  it("never truncates the name of a recurring energy pattern", () => {
    const page = pageSource("energy-flow");
    expect(page).toContain('whitespace-normal break-words [overflow-wrap:anywhere]');
    expect(page).not.toContain('<span className="truncate">{label}</span>');
  });

  it("shows user-written mood notes without clipping long unbroken words", () => {
    const page = pageSource("mood");
    expect(page).toContain('<div className="min-w-0 flex-1">');
    expect(page).toContain('leading-relaxed [overflow-wrap:anywhere]">{mood.note}');
  });

  it("uses readable metadata for hourly energy graph labels", () => {
    const page = pageSource("energy-map");
    expect(page).toContain('px-1 text-xs tabular-nums text-muted-foreground');
    expect(page).not.toContain('px-1 text-[10px]');
  });
});
