import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFlowItems } from "@/hooks/use-flow-items";
import type { Task } from "@/hooks/use-data";
import { todayISO } from "@/lib/flow-items";

const toggleTask = vi.fn();

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks, toggleTask }),
  useReminders: () => ({ reminders: [], toggleReminder: vi.fn() }),
}));
vi.mock("@/hooks/use-study-schedule", () => ({
  useStudySchedule: () => ({ lectures: [] }),
}));
vi.mock("@/hooks/use-child-events", () => ({ useChildEvents: () => [] }));
vi.mock("@/hooks/use-children", () => ({
  useChildren: () => ({ toggleItem: vi.fn() }),
}));
vi.mock("@/hooks/use-quickflow", () => ({
  useQuickflow: () => ({ items: [], complete: vi.fn(), uncomplete: vi.fn() }),
}));
vi.mock("@/hooks/use-priority-list", () => ({
  usePriorityList: () => ({ items: [], update: vi.fn() }),
}));
vi.mock("@/hooks/use-friction-library", () => ({
  useFrictionLibrary: () => ({ suggestFor: () => undefined }),
}));
vi.mock("@/hooks/use-done-log", () => ({
  useDoneLog: () => ({ isDone: () => false, toggleDone: vi.fn() }),
}));
vi.mock("@/hooks/use-instance-status", () => ({
  useInstanceStatus: () => ({ isInstanceDone: () => false, setInstanceDone: vi.fn() }),
}));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: () => [[], vi.fn()],
}));

let tasks: Task[] = [];

const isoDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe("useFlowItems – sena uppgifter följer med in i idag", () => {
  it("en öppen uppgift med klockslag från igår syns i dagens lista", () => {
    const yesterday = isoDaysAgo(1);
    tasks = [
      {
        id: "t1",
        title: "Ring tandläkaren",
        time: "14:00",
        dueDate: yesterday,
        completed: false,
      } as unknown as Task,
      {
        id: "t2",
        title: "Diska",
        time: "18:00",
        dueDate: todayISO(),
        completed: false,
      } as unknown as Task,
    ];

    const { result } = renderHook(() => useFlowItems());
    const ids = result.current.todayOpen.map((i) => i.id);
    expect(ids).toContain("task-t1");
    expect(ids).toContain("task-t2");

    const overdue = result.current.todayOpen.find((i) => i.id === "task-t1");
    expect(overdue?.priority).toBe("nu");
    expect(overdue?.time).toBe("14:00");
    expect(overdue?.daysUntil).toBe(-1);
  });

  it("avklarade uppgifter hör kvar till sin planerade dag, inte till idag", () => {
    tasks = [
      {
        id: "t3",
        title: "Städa",
        time: "09:00",
        dueDate: isoDaysAgo(2),
        completed: true,
        completedAt: Date.now(),
      } as unknown as Task,
    ];

    const { result } = renderHook(() => useFlowItems());
    expect(result.current.todayOpen.map((i) => i.id)).not.toContain("task-t3");
  });
});
