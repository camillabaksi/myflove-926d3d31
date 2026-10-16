import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeeklyPulseStats from "./weekly-pulse-stats";

const state = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: "admin" } }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/lib/weekly-pulse.functions", () => ({ getWeeklyPulseStatsFn: state.read }));
const row = {
  week_start: "2026-10-12",
  opened: 3,
  answered: 2,
  overview_counts: [0, 0, 0, 1, 1],
  relief_counts: [0, 0, 1, 1, 0],
  burden_counts: [1, 1, 0, 0, 0],
};
const empty = {
  week_start: "2026-10-05",
  opened: 0,
  answered: 0,
  overview_counts: [0, 0, 0, 0, 0],
  relief_counts: [0, 0, 0, 0, 0],
  burden_counts: [0, 0, 0, 0, 0],
};
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <WeeklyPulseStats />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.read.mockResolvedValue([row, empty]);
});
describe("Weekly pulse aggregates", () => {
  it("shows separate distributions, a true start denominator and a separate burden interpretation", async () => {
    show();
    await screen.findByText("2 svar av 3 startade veckopulser");
    expect(screen.getByText("Median: 4,5 · 2 svar")).toBeInTheDocument();
    expect(
      screen.getByText(/Här betyder högre svar att appen känts mer belastande/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Antal som bara har sett frågan mäts inte/)).toBeInTheDocument();
    expect(screen.queryByText(/@example/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2026-10-05" } });
    expect(screen.getByText(/Inga inskickade svar för den här veckan/)).toBeInTheDocument();
    expect(screen.getAllByText("Median: — · 0 svar")).toHaveLength(3);
  });
  it("does not replace failed data with zero responses", async () => {
    state.read.mockRejectedValue(new Error("unavailable"));
    show();
    await screen.findByRole("alert");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Upplevd nytta" })).queryByText(/0 svar/),
    ).not.toBeInTheDocument();
  });
});
