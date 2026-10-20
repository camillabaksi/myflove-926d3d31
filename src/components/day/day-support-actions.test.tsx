import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarEntry } from "@/lib/visual-calendar";
import DaySupportActions from "./day-support-actions";

const state = vi.hoisted(() => ({ addTask: vi.fn(), updateTask: vi.fn(), addTaskSteps: vi.fn(), updateReminder: vi.fn() }));

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: [], updateTask: state.updateTask, addTaskSteps: state.addTaskSteps, addTask: state.addTask }),
  useReminders: () => ({ reminders: [], updateReminder: state.updateReminder }),
}));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => ({ percent: null }) }));
vi.mock("@/components/day/day-replan", () => ({ DayReplanButton: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const date = "2026-10-20";
const entries = (): CalendarEntry[] => [
  { id: "heldag", sourceId: "heldag", source: "external", date, title: "Heldag", time: "00:00", endTime: "23:59", editable: false, done: false },
];

describe("Hand-picked recovery time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T07:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("saves a pause at the time the user typed when no safe gap was found", () => {
    render(<DaySupportActions date={date} entries={entries()} calendarReady initialMode="aterhamtning" />);
    expect(screen.getByText(/Inga säkra luckor hittades automatiskt/)).toBeInTheDocument();
    const save = screen.getByRole("button", { name: /Visa förslag/ });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Välj en tid själv/), { target: { value: "08:30" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(screen.getByText(/paus på 10 minuter kl\. 08:30/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Godkänn och spara" }));
    expect(state.addTask).toHaveBeenCalledWith(
      "Paus 10 min",
      date,
      expect.objectContaining({ time: "08:30", endTime: "08:40", energyImpact: "gives", recoveryAction: "paus" }),
    );
  });
});
