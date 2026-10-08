import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Task } from "@/hooks/use-data";
import { todayISO } from "@/lib/task-agenda";
import Tasks from "@/pages/tasks";

const actions = vi.hoisted(() => ({
  addTask: vi.fn(), toggleTask: vi.fn(), deleteTask: vi.fn(), unsnoozeTask: vi.fn(),
  setTaskStatus: vi.fn(), setTaskKind: vi.fn(), setTaskNote: vi.fn(), updateTask: vi.fn(),
  addTaskStep: vi.fn(), addTaskSteps: vi.fn(), toggleTaskStep: vi.fn(), deleteTaskStep: vi.fn(),
}));
const task: Task = { id: "owned-task", title: "En lång uppgift som ska behålla sitt fullständiga namn", completed: false, createdAt: 1 };
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ ...actions, activeTasks: [task], completedTasks: [], snoozedTasks: [] }) }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/myflove/block", () => ({
  MyFlovePageGrid: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div>,
  MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/myflove/motion", () => ({ MyFloveEmptyIllustration: () => null }));
vi.mock("@/components/area-switcher", () => ({ AreaSwitcher: () => null }));
vi.mock("@/components/collapsible-section", () => ({ default: ({ children, title }: { children: ReactNode; title: ReactNode }) => <section><h2>{title}</h2>{children}</section> }));
vi.mock("@/components/task-quick-add", () => ({ default: ({ onAdd }: { onAdd: (value: { title: string; dueDate: string; completed: boolean }) => void }) => <button onClick={() => onAdd({ title: "Ny uppgift", dueDate: todayISO(), completed: false })}>Lägg till</button> }));
vi.mock("@/hooks/use-flowscore", () => ({ useFlowScore: () => ({ flow: { score: 100 } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/encouragements", () => ({ getRandomEncouragement: () => "" }));
vi.mock("@/lib/flow-voice", () => ({ confirmations: { taskDone: "Klart" } }));
vi.mock("@/lib/life-areas", async (original) => {
  const actual = await original<typeof import("@/lib/life-areas")>();
  return { ...actual, useActiveArea: () => ({ activeArea: "alla" }) };
});
vi.mock("wouter", () => ({ Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe("Uppgifters sidlokala Paceable-presentation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("visar hela namnet och behåller avbockning och radering", () => {
    const { container } = render(<Tasks />);
    expect(container.querySelector(".pace-tasks-page")).not.toBeNull();
    expect(screen.getByText(task.title)).toHaveClass("pace-tasks-title");
    fireEvent.click(screen.getByRole("button", { name: "Markera klart" }));
    expect(actions.toggleTask).toHaveBeenCalledWith(task.id);
    fireEvent.click(screen.getByRole("button", { name: "Ta bort" }));
    expect(actions.deleteTask).toHaveBeenCalledWith(task.id);
  });

  it("byter vy utan att ändra uppgifter", () => {
    render(<Tasks />);
    fireEvent.click(screen.getByRole("button", { name: /Kommande/ }));
    expect(screen.getByRole("button", { name: /Kommande/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Klart/ }));
    expect(screen.getByRole("button", { name: /Klart/ })).toHaveAttribute("aria-pressed", "true");
    expect(actions.updateTask).not.toHaveBeenCalled();
    expect(actions.toggleTask).not.toHaveBeenCalled();
  });

  it("öppnar befintliga fält utan sparning och behåller kalenderåtgärden", () => {
    render(<Tasks />);
    const edit = screen.getByRole("button", { name: "Ändra" });
    fireEvent.click(edit);
    expect(edit).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Datum")).toBeInTheDocument();
    expect(screen.getByLabelText("Anteckning")).toBeInTheDocument();
    expect(actions.updateTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Lägg till i kalender/ }));
    expect(actions.updateTask).toHaveBeenCalledWith(task.id, { dueDate: todayISO(), time: expect.any(String) });
  });

  it("återanvänder den befintliga lägg-till-handlingen", () => {
    render(<Tasks />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till", exact: true }));
    expect(actions.addTask).toHaveBeenCalledWith("Ny uppgift", todayISO(), expect.objectContaining({ completed: false }));
  });
});