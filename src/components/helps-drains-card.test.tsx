import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

const model = vi.hoisted(() => ({ entries: [] as EnergyFactorEntry[] }));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({ entries: model.entries }),
}));
import HelpsDrainsCard from "./helps-drains-card";

const factor = (direction: "gives" | "drains", category: string, i: number): EnergyFactorEntry => ({
  id: String(i), title: "Privat aktivitet", category, direction,
  strength: 2, kind: "vardag", friction: null, note: null,
  countsTowardScore: true, occurredAt: new Date().toISOString(),
}) as EnergyFactorEntry;

describe("Concise energy patterns in Insights", () => {
  it("offers a single calm explanation, not two large empty pattern cards", () => {
    model.entries = [];
    render(<HelpsDrainsCard />);
    expect(screen.getByRole("heading", { name: "Vad ger och tar energi?" })).toBeTruthy();
    expect(screen.getByText(/Inga tydliga mönster ännu/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Ger energi" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tar energi" })).toBeNull();
  });

  it("shows only the supported direction without inventing an empty other category", () => {
    model.entries = [factor("gives", "rorelse", 1), factor("gives", "rorelse", 2), factor("drains", "rorelse", 3)];
    render(<HelpsDrainsCard />);
    expect(screen.getByRole("heading", { name: "Ger energi" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Tar energi" })).toBeNull();
    expect(screen.getByText(/Inget tydligt mönster för vad som tar energi ännu/)).toBeTruthy();
    expect(screen.getByText(/67 % av 3 svar/)).toBeTruthy();
  });

  it("keeps both real directions available when there is sufficient evidence", () => {
    model.entries = [
      ...[1, 2, 3].map((i) => factor("gives", "rorelse", i)),
      ...[4, 5, 6].map((i) => factor("drains", "stress", i)),
    ];
    render(<HelpsDrainsCard />);
    expect(screen.getByRole("heading", { name: "Ger energi" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tar energi" })).toBeTruthy();
    expect(screen.queryByText(/Inga tydliga mönster ännu/)).toBeNull();
  });
});
