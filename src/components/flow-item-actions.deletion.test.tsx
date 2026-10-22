import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowItemActions from "./flow-item-actions";

const calls = vi.hoisted(() => ({ deleteTask: vi.fn(), updateTask: vi.fn(), deleteReminder: vi.fn(), updateReminder: vi.fn() }));

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({
    tasks: [
      { id: "a", title: "Ring skolan", dueDate: "2026-10-20", time: "09:00", completed: false },
      { id: "b", title: "Ring skolan", dueDate: "2026-10-21", time: "09:00", completed: false },
      { id: "undated", title: "Skriv ett brev", completed: false },
    ],
    updateTask: calls.updateTask,
    deleteTask: calls.deleteTask,
  }),
  useReminders: () => ({ reminders: [
    { id: "period", title: "Pågående kurs", date: "2026-11-01", endDate: "2026-11-30", time: undefined, note: "Veckokurs", repeat: "none" },
  ], updateReminder: calls.updateReminder, deleteReminder: calls.deleteReminder }),
}));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ items: [], update: vi.fn(), remove: vi.fn() }) }));
vi.mock("@/hooks/use-priority-list", () => ({ usePriorityList: () => ({ items: [], update: vi.fn(), remove: vi.fn() }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: () => [[], vi.fn()] }));

beforeEach(() => { calls.deleteTask.mockReset(); calls.updateTask.mockReset(); calls.deleteReminder.mockReset(); calls.updateReminder.mockReset(); });

describe("Delete a day activity by source identity", () => {
  it("edits title, date and time in one step, while keeping optional controls collapsed", () => {
    const saved = vi.fn();
    render(<FlowItemActions itemId="task-a" showLabel onSaved={saved} />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra aktivitet" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByLabelText("Vad gäller det?")).toHaveValue("Ring skolan");
    expect(dialog.getByLabelText("Datum")).toHaveValue("2026-10-20");
    expect(dialog.getByLabelText("Tid (frivilligt)")).toHaveValue("09:00");
    expect(dialog.getByText("Fler inställningar (frivilligt)").closest("details")).not.toHaveAttribute("open");
    fireEvent.change(dialog.getByLabelText("Vad gäller det?"), { target: { value: "Ring läraren" } });
    fireEvent.change(dialog.getByLabelText("Datum"), { target: { value: "2026-10-25" } });
    fireEvent.change(dialog.getByLabelText("Tid (frivilligt)"), { target: { value: "10:15" } });
    fireEvent.click(dialog.getByRole("button", { name: "Spara ändringar" }));
    expect(calls.updateTask).toHaveBeenCalledTimes(1);
    expect(calls.updateTask).toHaveBeenCalledWith("a", expect.objectContaining({
      title: "Ring läraren", dueDate: "2026-10-25", time: "10:15",
    }));
    expect(calls.deleteTask).not.toHaveBeenCalled();
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it("allows editing a task with no due date without assigning a date", () => {
    render(<FlowItemActions itemId="task-undated" showLabel />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra aktivitet" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByLabelText("Datum")).toHaveValue("");
    fireEvent.change(dialog.getByLabelText("Vad gäller det?"), { target: { value: "Skriv brevet" } });
    fireEvent.click(dialog.getByRole("button", { name: "Spara ändringar" }));
    expect(calls.updateTask).toHaveBeenCalledWith("undated", expect.objectContaining({
      title: "Skriv brevet", dueDate: undefined,
    }));
  });

  it("keeps existing continuous-period settings available without turning it into a timed task", () => {
    render(<FlowItemActions itemId="rem-period" showLabel />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra aktivitet" }));
    const dialog = within(screen.getByRole("dialog"));
    const more = dialog.getByText("Fler inställningar (frivilligt)").closest("details");
    expect(more).toHaveAttribute("open");
    expect(dialog.getByLabelText(/Slutdatum \(valfritt/)).toHaveValue("2026-11-30");
    expect(dialog.queryByLabelText("Tid (frivilligt)")).not.toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText(/Slutdatum \(valfritt/), { target: { value: "2026-12-01" } });
    fireEvent.click(dialog.getByRole("button", { name: "Spara ändringar" }));
    expect(calls.updateReminder).toHaveBeenCalledWith("period", expect.objectContaining({
      endDate: "2026-12-01", time: undefined, endTime: undefined,
    }));
  });

  it("does not save an end time earlier than its start", () => {
    render(<FlowItemActions itemId="task-a" showLabel />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra aktivitet" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByText("Fler inställningar (frivilligt)"));
    fireEvent.change(dialog.getByLabelText("Sluttid (frivilligt)"), { target: { value: "08:30" } });
    fireEvent.click(dialog.getByRole("button", { name: "Spara ändringar" }));
    expect(calls.updateTask).not.toHaveBeenCalled();
    expect(dialog.getByLabelText("Sluttid (frivilligt)")).toHaveValue("08:30");
  });
  it("deletes only the selected task even when another day carries the same title and time", () => {
    render(<FlowItemActions itemId="task-a" compact />);
    fireEvent.click(screen.getByRole("button", { name: "Fler val" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Ta bort" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Ta bort", exact: true }));
    fireEvent.click(dialog.getByRole("button", { name: "Ja, ta bort" }));
    expect(calls.deleteTask).toHaveBeenCalledTimes(1);
    expect(calls.deleteTask).toHaveBeenCalledWith("a");
    expect(calls.deleteTask).not.toHaveBeenCalledWith("b");
    expect(calls.deleteReminder).not.toHaveBeenCalled();
  });
});
