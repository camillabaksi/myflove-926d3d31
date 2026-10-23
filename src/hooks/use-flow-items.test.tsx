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
  it("visar två separata aktiviteter med samma namn och klockslag i Idag och Kalender", () => {
    const date = todayISO();
    tasks = [
      { id: "shopping-one", title: "Handla", dueDate: date, time: "14:00", completed: false } as Task,
      { id: "shopping-two", title: "Handla", dueDate: date, time: "14:00", completed: false } as Task,
    ];
    reminders = [{ id: "calendar-one", title: "Handla", date, time: "14:00", completed: false, createdAt: 1 }];
    const { result } = renderHook(() => useFlowItems(date));
    const ids = result.current.todayOpen.map(item => item.id);
    expect(ids).toEqual(expect.arrayContaining(["task-shopping-one", "task-shopping-two", "rem-calendar-one"]));
    expect(ids).toHaveLength(3);
    act(() => result.current.toggleItem(result.current.items.find(item => item.id === "task-shopping-two")!));
    expect(toggleTask).toHaveBeenCalledExactlyOnceWith("shopping-two");
    expect(toggleReminder).not.toHaveBeenCalled();
  });

  it("visar både en sen och en dagens uppgift med samma namn och klockslag", () => {
    const date = todayISO();
    tasks = [
      { id: "overdue", title: "Handla", dueDate: isoDaysAgo(1), time: "14:00", completed: false } as Task,
      { id: "today", title: "Handla", dueDate: date, time: "14:00", completed: false } as Task,
    ];
    const { result } = renderHook(() => useFlowItems(date));
    expect(result.current.todayOpen.map(item => item.id))
      .toEqual(expect.arrayContaining(["task-overdue", "task-today"]));
    expect(result.current.todayOpen).toHaveLength(2);
    expect(result.current.todayOpen.find(item => item.id === "task-overdue")?.daysUntil).toBe(-1);
  });

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
  it("keeps a moved reminder and the normal recurring event independently completable", () => {
    reminders = [{
      id: "repeat", title: "Promenad", date: "2026-10-20", time: "09:00",
      repeat: "daily", completed: false, createdAt: 1,
      occurrenceOverrides: { "2026-10-21": { date: "2026-10-22", time: "10:15" } },
    }];
    const date = "2026-10-22";
    const { result } = renderHook(() => useFlowItems(date));
    expect(result.current.items.filter(e => e.source === "kalender").map(e => [e.id, e.time]))
      .toEqual([["rem-repeat", "09:00"], ["rem-repeat:2026-10-21", "10:15"]]);
    const moved = result.current.items.find(e => e.id === "rem-repeat:2026-10-21")!;
    const normal = result.current.items.find(e => e.id === "rem-repeat")!;
    act(() => result.current.toggleItem(moved));
    expect(setInstanceDone).toHaveBeenCalledWith("reminder-repeat", "2026-10-21", true);
    act(() => result.current.toggleItem(normal));
    expect(setInstanceDone).toHaveBeenCalledWith("reminder-repeat", "2026-10-22", true);
    expect(result.current.deleteItem(moved)).toBe(false);
  });

  it("does not collapse two reminder occurrences when a move creates equal times", () => {
    reminders = [{
      id: "repeat", title: "Promenad", date: "2026-10-20", time: "09:00",
      repeat: "daily", completed: false, createdAt: 1,
      occurrenceOverrides: { "2026-10-21": { date: "2026-10-22", time: "09:00" } },
    }];
    const { result } = renderHook(() => useFlowItems("2026-10-22"));
    expect(result.current.items.filter(e => e.source === "kalender")).toHaveLength(2);
  });
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
