import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const fixtures = vi.hoisted(() => {
  const make = (count: number) => Array.from({ length: count }, (_, index) => ({
    key: `period-${index}`, label: `Period ${index + 1}`, accessibleLabel: `Period ${index + 1}`,
    battery: index === 1 ? 0 : index === 2 ? 75 : null,
    loadMinutes: index === 2 ? 90 : 0, loadCount: index === 1 || index === 2 ? 1 : 0, observedDays: index > 0 ? 1 : 0,
  }));
  return { periods: { days: make(28), weeks: make(12), months: make(12) } };
});
vi.mock("@/hooks/use-battery-load-trend", () => ({ useBatteryLoadTrend: () => ({
  periods: fixtures.periods, summary: "Befintlig sammanfattning", direction: "steady",
  loadMinutes: 90, loadOccasions: 1, energyLogs: 2, pairedOccasions: 0,
}) }));
vi.mock("@/components/collapsible-section", () => ({ default: ({ children }: { children: ReactNode }) => <section>{children}</section> }));
import BatteryLoadTrend, { BatteryLoadPeriods } from "./battery-load-trend";

describe("Batteri och faktisk tid – isolerad presentation", () => {
  it.each([28, 12])("behåller %i perioder i en stabil och svepbar rad", (count) => {
    render(<BatteryLoadPeriods periods={fixtures.periods.days.slice(0, count)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(count);
    expect(screen.getByRole("list").className).toContain("w-max");
    expect(screen.getByRole("region").className).toContain("overflow-x-auto");
    expect(screen.getAllByRole("listitem").every(item => item.className.includes("shrink-0") && !item.className.includes("truncate"))).toBe(true);
  });
  it("skiljer saknat batteri från noll och visar tid, enhet och aktivitetsantal", () => {
    render(<BatteryLoadPeriods periods={fixtures.periods.days} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]?.querySelector('[data-series="battery"]')).toBeNull();
    expect(items[0]?.getAttribute("aria-label")).toContain("ingen batteriincheckning");
    expect(items[0]?.textContent).toContain("Ej incheckat");
    expect(items[1]?.querySelector('[data-series="battery"]')).toBeTruthy();
    expect(items[1]?.getAttribute("aria-label")).toContain("0 procent batteri, 0 min på 1 genomförda aktiviteter");
    expect(items[2]?.textContent).toContain("Tid 1 h 30 min");
    expect(items[2]?.querySelector('[data-series="time"]')?.getAttribute("style")).toContain("height: 100%");
  });
  it("gör alla perioder åtkomliga med pilar, Home/End och lämnar vertikala pilar ifred", () => {
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(<BatteryLoadPeriods periods={fixtures.periods.days} />);
    const items = screen.getAllByRole("listitem"), first = items[0], last = items[27];
    if (!first || !last) throw new Error("Perioder saknas");
    first.focus(); fireEvent.keyDown(first, { key: "End" }); expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Home" }); expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "ArrowRight" }); expect(document.activeElement).toBe(items[1]);
    expect(fireEvent.keyDown(first, { key: "ArrowDown" })).toBe(true);
    HTMLElement.prototype.scrollIntoView = original;
  });
  it("byter mellan ursprungliga 28 dagar, 12 veckor och 12 månader", () => {
    render(<BatteryLoadTrend />);
    expect(screen.getAllByRole("listitem")).toHaveLength(28);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Veckor" }), { button: 0, ctrlKey: false });
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Månader" }), { button: 0, ctrlKey: false });
    expect(screen.getByText("Senaste 12 månaderna")).toBeTruthy();
    expect(screen.getByText(/sluttid minus starttid, eller uppskattat 30 minuter/)).toBeTruthy();
    expect(screen.getByText("Befintlig sammanfattning")).toBeTruthy();
  });
  it("behåller synligt fokus och minst 44 px kontrollhöjd", () => {
    render(<BatteryLoadTrend />);
    for (const tab of screen.getAllByRole("tab")) expect(tab.className).toContain("min-h-11");
    for (const button of screen.getAllByRole("button")) expect(button.className).toContain("h-11");
    expect(screen.getAllByRole("listitem")[0]?.className).toContain("focus-visible:outline-ring");
  });
  it("A1: staplar periodväljare och anpassar periodbredd efter diagrammets synliga yta", () => {
    render(<BatteryLoadTrend />);
    expect(screen.getByRole("tablist").className).toContain("grid-cols-1");
    expect(screen.getByRole("tablist").className).toContain("@[22rem]:grid-cols-3");
    expect(screen.getByRole("region").className).toContain("@container");
    expect(screen.getAllByRole("listitem")[0].className).toContain("w-[min(8rem,calc(100cqw-12px))]");
  });
});
