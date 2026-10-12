import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { addDaysISO, todayISO } from "@/lib/day";
const mocks = vi.hoisted(() => ({ update: vi.fn(), entries: [] as unknown[] }));
vi.mock("@/hooks/use-energy-flow", () => ({ useEnergyFlow: () => ({ entries: mocks.entries, updateFactor: mocks.update, removeFactor: vi.fn(), toggleCounts: vi.fn(), signedIn: false, loadDay: vi.fn() }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text, locale: "sv-SE" }) }));
vi.mock("@/components/myflove/block", () => ({ MyFloveBlock: ({ children }: { children: ReactNode }) => <section>{children}</section> }));
import EnergyHistory from "./energy-history";
const entry = (id: string, date: string, title: string) => ({ id, title, occurredAt: `${date}T12:00:00`, direction: "drains", strength: 3, category: "annat", kind: "vardag", friction: null, note: null, countsTowardScore: true });
beforeEach(() => {
  mocks.entries = [entry("today", todayISO(), "Dagens promenad"), entry("shelf", addDaysISO(todayISO(), -1), "Byggde hyllan"), entry("older", addDaysISO(todayISO(), -8), "Äldre paus")];
  mocks.update.mockReset();
  mocks.update.mockResolvedValue(undefined);
});
describe("energy history", () => {
  it("opens today, browses yesterday and earlier dates without modifying any record", () => {
    render(<EnergyHistory />);
    expect(screen.getByText(/Dagens promenad/)).toBeTruthy();
    expect(screen.queryByText(/Byggde hyllan/)).toBeNull();
    expect(screen.getByRole("button", { name: "Nästa dag" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Igår" }));
    expect(screen.getByText(/Byggde hyllan/)).toBeVisible();
    expect(screen.queryByText(/Dagens promenad/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Välj dag"), { target: { value: addDaysISO(todayISO(), -8) } });
    expect(screen.getByText(/Äldre paus/)).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("updates only the selected historical factor and can register a small effect", async () => {
    render(<EnergyHistory />);
    fireEvent.click(screen.getByRole("button", { name: "Igår" }));
    fireEvent.change(screen.getByLabelText("Styrka för Byggde hyllan"), { target: { value: "1" } });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith("shelf", { strength: 1 }));
  });
  it("shows a save failure and keeps the selected day available", async () => {
    mocks.update.mockRejectedValue(new Error("Offline"));
    render(<EnergyHistory />);
    fireEvent.click(screen.getByRole("button", { name: "Igår" }));
    fireEvent.change(screen.getByLabelText("Energipåverkan för Byggde hyllan"), { target: { value: "gives" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Ändringen kunde inte sparas");
    expect(screen.getByLabelText("Välj dag")).toHaveValue(addDaysISO(todayISO(), -1));
  });
});
