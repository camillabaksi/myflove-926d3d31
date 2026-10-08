import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ImpactEntry } from "@/lib/impact-checkin";

const logImpact = vi.fn();
const clearImpact = vi.fn();
let impact: ImpactEntry | null = null;
vi.mock("@/hooks/use-impact-checkin", () => ({ useImpactCheckin: () => ({ impact, logImpact, clearImpact }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text }) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/components/myflove", () => ({ MyFloveIcon: () => <span aria-hidden="true" /> }));
vi.mock("@/components/myflove/expandable-block", () => ({
  ExpandableBlock: ({ children }: { children: React.ReactNode }) => <section data-testid="legacy-checkin">{children}</section>,
}));

import ImpactCheckin, { type CalendarImpactDraft } from "./impact-checkin";

function CalendarHarness() {
  const [draft, setDraft] = useState<CalendarImpactDraft | null>(null);
  const [view, setView] = useState("Månad");
  return <>
    {["Månad", "Vecka", "Dag"].map(label => <button key={label} onClick={() => setView(label)}>{label}</button>)}
    {/* Match planner's distinct check-in positions: month/week versus day. */}
    {view !== "Dag" && <ImpactCheckin calendarMobile draft={draft} onDraftChange={setDraft} />}
    {view === "Dag" && <div><ImpactCheckin calendarMobile draft={draft} onDraftChange={setDraft} /></div>}
  </>;
}

describe("Mobilkalenderns befintliga påverkanregistrering", () => {
  beforeEach(() => { vi.clearAllMocks(); impact = null; });

  it("är stängd som standard med tillgänglig helradsknapp", () => {
    render(<CalendarHarness />);
    const trigger = screen.getByRole("button", { name: /Vad påverkar din kapacitet/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("button", { name: /Jag har sovit dåligt/ })).toBeNull();
    expect(screen.getByText("Lägg till vid behov")).toBeVisible();
  });

  it("bevarar alla osparade val vid hopfällning och Månad/Vecka/Dag utan autosparning", () => {
    render(<CalendarHarness />);
    const trigger = () => screen.getByRole("button", { name: /Vad påverkar din kapacitet/ });
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: /Jag har sovit dåligt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Måttligt" }));
    fireEvent.click(screen.getByRole("button", { name: "Har påverkat mig" }));
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: "Dag" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger());
    for (const label of ["Vecka", "Månad", "Dag"]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /Jag har sovit dåligt/ })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Måttligt" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Har påverkat mig" })).toHaveAttribute("aria-pressed", "true");
    }
    expect(logImpact).not.toHaveBeenCalled();
    expect(clearImpact).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Spara påverkan" }));
    expect(logImpact).toHaveBeenCalledExactlyOnceWith(["somn"], "mattligt", "tidigare");
  });

  it("bevarar befintlig validering och exakt formulärets alternativ", () => {
    render(<CalendarHarness />);
    fireEvent.click(screen.getByRole("button", { name: /Vad påverkar din kapacitet/ }));
    expect(screen.getByText("Kropp & hälsa")).toBeVisible();
    expect(screen.getByText("Känslor & tankar")).toBeVisible();
    expect(screen.getByText("Omgivning")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Jag är sjuk idag/ }));
    expect(screen.getByRole("button", { name: "Spara påverkan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Lite" }));
    expect(screen.getByRole("button", { name: "Spara påverkan" })).toBeEnabled();
  });

  it("återställer inte ett pågående utkast när sparad kontext laddas", () => {
    const { rerender } = render(<CalendarHarness />);
    fireEvent.click(screen.getByRole("button", { name: /Vad påverkar din kapacitet/ }));
    fireEvent.click(screen.getByRole("button", { name: /Jag har sovit dåligt/ }));
    impact = { day: "2026-10-08", kinds: ["sjuk"], degree: "mycket", timing: "nu", ts: 1 };
    rerender(<CalendarHarness />);
    expect(screen.getByRole("button", { name: /Jag har sovit dåligt/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Jag är sjuk idag/ })).toHaveAttribute("aria-pressed", "false");
    expect(logImpact).not.toHaveBeenCalled();
  });

  it("lämnar andra sidors standardpresentation oförändrad", () => {
    render(<ImpactCheckin />);
    expect(screen.getByTestId("legacy-checkin")).toBeTruthy();
    expect(screen.queryByText("Lägg till vid behov")).toBeNull();
  });
});