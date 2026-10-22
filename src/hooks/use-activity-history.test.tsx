import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState, type SetStateAction } from "react";
import type { Reminder, Task } from "@/hooks/use-data";

const data = vi.hoisted(() => ({
  tasks: [] as Task[],
  reminders: [] as Reminder[],
  storage: new Map<string, unknown>(),
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: data.tasks }),
  useReminders: () => ({ reminders: data.reminders }),
  useMoods: () => ({ moods: [] }),
}));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ items: [] }) }));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: <T,>(key: string, initial: T) => {
    const [value, setValue] = useState<T>(() => (data.storage.get(key) as T) ?? initial);
    return [
      value,
      (next: SetStateAction<T>) =>
        setValue((previous) => {
          const updated = typeof next === "function" ? (next as (value: T) => T)(previous) : next;
          data.storage.set(key, updated);
          return updated;
        }),
    ] as const;
  },
}));
import { useActivityHistory } from "@/hooks/use-activity-history";

beforeEach(() => {
  data.tasks = [];
  data.reminders = [];
  data.storage.clear();
});

describe("aktiviteters sparade energipåverkan", () => {
  it("finns kvar på rätt återkommande dag när historiken öppnas igen", () => {
    data.reminders = [
      {
        id: "one",
        title: "Promenad",
        date: "2026-10-01",
        repeat: "daily",
        completed: false,
        createdAt: 1,
      },
    ];
    const first = renderHook(() => useActivityHistory());
    const factor = { id: "factor-one", occurredAt: "2026-10-11T09:00:00.000Z" };
    act(() => first.result.current.complete("reminder-one", "2026-10-11"));
    act(() => first.result.current.setEnergy("reminder-one", "2026-10-11", "drains_much", factor));
    first.unmount();
    const reopened = renderHook(() => useActivityHistory());
    const days = reopened.result.current.instancesBetween("2026-10-11", "2026-10-12");
    expect(days[0]).toMatchObject({
      sourceId: "reminder-one",
      date: "2026-10-11",
      status: "genomford",
      energyImpact: "drains_much",
    });
    expect(days[1].energyImpact).toBeUndefined();
    expect(reopened.result.current.records[0].energyFactorId).toBe(factor.id);
    act(() => reopened.result.current.setEnergy("reminder-one", "2026-10-11", "gives", factor));
    expect(reopened.result.current.records).toHaveLength(1);
    expect(
      reopened.result.current.instancesBetween("2026-10-11", "2026-10-11")[0].energyImpact,
    ).toBe("gives");
  });

  it("stores an overdue activity's selected actual day on its original planned occurrence", () => {
    data.tasks = [{
      id: "shopping", title: "Handla", dueDate: "2026-10-21",
      completed: true, completedAt: Date.parse("2026-10-22T12:09:00+02:00"),
    } as Task];
    const { result } = renderHook(() => useActivityHistory());
    const factor = { id: "factor-shopping", occurredAt: "2026-10-21T12:00:00+02:00" };
    act(() => result.current.setEnergy("task-shopping", "2026-10-21", "drains_little", factor, "2026-10-21"));
    const instance = result.current.instancesBetween("2026-10-21", "2026-10-22").find(i => i.sourceId === "task-shopping");
    expect(instance).toMatchObject({
      date: "2026-10-21", plannedDate: "2026-10-21", actualDate: "2026-10-21",
      energyImpact: "drains_little", status: "genomford",
    });
    expect(result.current.records[0]).toMatchObject({ key: "task-shopping|2026-10-21", actualDate: "2026-10-21", energyFactorId: "factor-shopping" });
  });

  it("visar en odaterad genomförd uppgift på dess faktiska dag utan att ge öppna uppgifter ett påhittat datum", () => {
    data.tasks = [
      {
        id: "done",
        title: "Handla",
        completed: true,
        completedAt: new Date(2026, 9, 11, 12).getTime(),
      } as Task,
      { id: "open", title: "Städa", completed: false } as Task,
    ];
    const { result } = renderHook(() => useActivityHistory());
    act(() => result.current.setEnergy("task-done", "2026-10-11", "drains_much"));
    expect(result.current.instancesBetween("2026-10-10", "2026-10-12")).toEqual([
      expect.objectContaining({
        sourceId: "task-done",
        date: "2026-10-11",
        status: "genomford",
        energyImpact: "drains_much",
      }),
    ]);
  });
});
