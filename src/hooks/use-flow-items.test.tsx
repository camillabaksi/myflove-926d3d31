import { beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFlowItems } from "@/hooks/use-flow-items";
import type { Reminder, Task } from "@/hooks/use-data";
import { ACTIVITY_DONE_EVENT, emitActivityDone } from "@/lib/activity-energy-event";
import { todayISO } from "@/lib/flow-items";
import type { FlowItem } from "@/lib/flow-items";

const toggleTask = vi.fn();
const toggleReminder = vi.fn();
const setInstanceDone = vi.fn();

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks, toggleTask }),
  useReminders: () => ({ reminders, toggleReminder }),
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
  useInstanceStatus: () => ({ isInstanceDone: () => false, setInstanceDone }),
}));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: () => [[], vi.fn()],
}));

let tasks: Task[] = [];
let reminders: Reminder[] = [];

beforeEach(() => {
  tasks = [];
  reminders = [];
  vi.clearAllMocks();
});

const isoDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe("useFlowItems – sena uppgifter följer med in i idag", () => {
  it("delegates an ordinary reminder to the source, producing just one energy prompt", () => {
    const date = todayISO();
    reminders = [{ id: "once", title: "Lämna nyckel", date, time: "16:00", completed: false, createdAt: 1, repeat: "none" }];
    const events: unknown[] = [];
    const listener = (event: Event) => events.push((event as CustomEvent).detail);
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
    toggleReminder.mockImplementationOnce(() => emitActivityDone({ id: "rem-once", title: "Lämna nyckel", dueDate: date }));
    try {
      const { result } = renderHook(() => useFlowItems(date));
      const selected = result.current.items.find((entry) => entry.id === "rem-once")!;
      act(() => result.current.toggleItem(selected));
      expect(toggleReminder).toHaveBeenCalledOnce();
      expect(toggleReminder).toHaveBeenCalledWith("once");
      expect(events).toEqual([{ id: "rem-once", title: "Lämna nyckel", dueDate: date }]);
      expect(setInstanceDone).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
    }
  });

  it.each(["2026-10-11", "2026-10-12"])(
    "registrerar energisvaret på den genomförda förekomsten %s, inte seriens startdatum",
    (date) => {
      reminders = [
        {
          id: "one",
          title: "Promenad",
          date: "2026-10-01",
          time: "09:00",
          repeat: "daily",
          completed: false,
          createdAt: 1,
        },
      ];
      const events: unknown[] = [];
      const listener = (event: Event) => events.push((event as CustomEvent).detail);
      window.addEventListener(ACTIVITY_DONE_EVENT, listener);
      try {
        const { result } = renderHook(() => useFlowItems(date));
        const item = result.current.items.find((entry) => entry.id === "rem-one")!;
        act(() => result.current.toggleItem(item));
        expect(events).toEqual([{ id: "rem-one", title: "Promenad", dueDate: date }]);
        expect(setInstanceDone).toHaveBeenCalledWith("reminder-one", date, true);
        expect(toggleReminder).not.toHaveBeenCalled();
      } finally {
        window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
      }
    },
  );
  it("rejects completion for child schedules even with an incorrect task flag", () => {
    toggleTask.mockClear();
    const { result } = renderHook(() => useFlowItems());
    result.current.toggleItem({
      id: "task-child",
      title: "Frukost",
      source: "barn",
      area: "barn",
      emoji: "",
      priority: "idag",
      completable: true,
    } as FlowItem);
    expect(toggleTask).not.toHaveBeenCalled();
    result.current.toggleItem({
      id: "task-parent",
      title: "Packa väskan",
      source: "uppgift",
      area: "barn",
      emoji: "",
      priority: "idag",
      completable: true,
    } as FlowItem);
    expect(toggleTask).toHaveBeenCalledWith("parent");
  });
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
