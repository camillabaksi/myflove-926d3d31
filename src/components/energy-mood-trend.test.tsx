import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnergyMoodPeriods } from "./energy-mood-trend";
import type { TrendPeriod } from "@/lib/energy-mood-trend";

const periods: TrendPeriod[] = Array.from({ length: 8 }, (_, index) => ({
  key: `week-${index}`, label: `v ${index + 1}`, accessibleLabel: `Vecka ${index + 1}`,
  energy: index === 1 ? 0 : index === 2 ? 70 : null,
  mood: index === 2 ? 50 : null, energyLogs: index === 1 || index === 2 ? 1 : 0, moodLogs: index === 2 ? 1 : 0,
}));

describe("Energi och mående – periodpresentation", () => {
  it("behåller åtta perioder i en stabil, obruten och svepbar rad", () => {
    render(<EnergyMoodPeriods periods={periods} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByRole("list").className).toContain("w-max");
    expect(screen.getByRole("region").className).toContain("overflow-x-auto");
    for (const item of screen.getAllByRole("listitem")) {
      expect(item.className).toContain("shrink-0");
      expect(item.className).not.toContain("truncate");
    }
  });
  it("lämnar saknade värden tomma och skiljer dem från registrerat nollvärde", () => {
    render(<EnergyMoodPeriods periods={periods} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]?.querySelectorAll("[data-series]")).toHaveLength(0);
    expect(items[0]?.getAttribute("aria-label")).toContain("inga energisvar");
    expect(items[1]?.getAttribute("aria-label")).toContain("energipåverkan 0 av 100");
    // Vågen bryts vid saknade värden: en sammanhängande energidel (0 och 70), aldrig nollad.
    expect(document.querySelectorAll('[data-chart="wave"] [data-series="energy"]')).toHaveLength(1);
    expect(items[2]?.getAttribute("aria-label")).toContain("mående 50 av 100");
  });
  it("gör datum och båda värdena åtkomliga utan att förlita sig på färger", () => {
    render(<EnergyMoodPeriods periods={periods} />);
    const item = screen.getByRole("listitem", { name: "Vecka 3: energipåverkan 70 av 100, mående 50 av 100, 1 energisvar · 1 måendelogg" });
    expect(item.textContent).toContain("Energipåverkan 70/100");
    expect(item.textContent).toContain("Mående 50/100");
  });
  it("stöder piltangenter, Home och End utan att fånga vertikala pilar", () => {
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    render(<EnergyMoodPeriods periods={periods} />);
    const items = screen.getAllByRole("listitem");
    const first = items[0], last = items[7];
    if (!first || !last) throw new Error("Perioder saknas");
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toBe(items[1]);
    expect(fireEvent.keyDown(items[1] ?? first, { key: "ArrowDown" })).toBe(true);
    expect(scroll).toHaveBeenCalled();
  });
  it("A1: periodbredden anpassas efter diagrammets synliga yta", () => {
    render(<EnergyMoodPeriods periods={Array.from({ length: 8 }, (_, i) => ({ key: `p${i}`, label: `V${i}`, accessibleLabel: `Vecka ${i}`, energy: null, mood: null })) as unknown as TrendPeriod[]} />);
    expect(screen.getByRole("region").className).toContain("@container");
    expect(screen.getAllByRole("listitem")[0].className).toContain("w-[min(6rem,calc(100cqw-12px))]");
  });
});
