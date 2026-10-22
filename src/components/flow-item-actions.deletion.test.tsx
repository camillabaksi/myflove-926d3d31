import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlowItemActions from "./flow-item-actions";

const calls = vi.hoisted(() => ({ deleteTask: vi.fn(), updateTask: vi.fn(), deleteReminder: vi.fn() }));

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({
    tasks: [
      { id: "a", title: "Ring skolan", dueDate: "2026-10-20", time: "09:00", completed: false },
      { id: "b", title: "Ring skolan", dueDate: "2026-10-21", time: "09:00", completed: false },
    ],
    updateTask: calls.updateTask,
    deleteTask: calls.deleteTask,
  }),
  useReminders: () => ({ reminders: [], updateReminder: vi.fn(), deleteReminder: calls.deleteReminder }),
}));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ items: [], update: vi.fn(), remove: vi.fn() }) }));
vi.mock("@/hooks/use-priority-list", () => ({ usePriorityList: () => ({ items: [], update: vi.fn(), remove: vi.fn() }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: () => [[], vi.fn()] }));

beforeEach(() => { calls.deleteTask.mockReset(); calls.updateTask.mockReset(); calls.deleteReminder.mockReset(); });

describe("Delete a day activity by source identity", () => {
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
