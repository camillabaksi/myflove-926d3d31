import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "./use-data";
import { useTasks } from "./use-data";
import type { ReplanChange } from "@/lib/day-replan";

const state = vi.hoisted(() => ({ tasks: [] as Task[], owner: "account-a", writes: 0 }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: () => [state.tasks, (update: (prev: Task[]) => Task[]) => {
  const next = update(state.tasks); state.tasks = next; state.writes++;
}] }));
vi.mock("@/lib/cloud-list", () => ({ useCloudSyncedList: () => [[], vi.fn()] }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (id: string) => id === state.owner }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/flow-signal", () => ({ flowDone: vi.fn() }));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));
vi.mock("@/lib/activity-energy-event", () => ({ emitActivityDone: vi.fn() }));
const date = "2026-10-15";
const change: ReplanChange = { id: "a:time", taskId: "a", title: "Handla", kind: "time", before: "14:00–14:45", after: "15:15–16:00", reason: "Tidskrock", patch: { time: "15:15", endTime: "16:00" } };
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T12:00:00"));
  state.owner = "account-a"; state.writes = 0;
  state.tasks = [{ id: "a", title: "Handla", dueDate: date, time: "14:00", endTime: "14:45", completed: false, createdAt: 1, note: "Behåll" }];
});
afterEach(() => vi.useRealTimers());
describe("Account-owned replanning writes", () => {
  it("writes the selected patch once through the shared task store, preserving original fields", () => {
    const { result } = renderHook(() => useTasks());
    result.current.applyDayReplan(state.tasks, [change], date, "account-a");
    expect(state.writes).toBe(1);
    expect(state.tasks[0]).toMatchObject({ id: "a", note: "Behåll", dueDate: date, time: "15:15", endTime: "16:00", completed: false });
  });
  it("blocks an old account or day before writing", () => {
    const { result } = renderHook(() => useTasks());
    const before = state.tasks;
    state.owner = "account-b";
    expect(() => result.current.applyDayReplan(before, [change], date, "account-a")).toThrow(/Kontot/);
    expect(state.writes).toBe(0);
    state.owner = "account-a"; vi.setSystemTime(new Date("2026-10-16T00:01:00"));
    expect(() => result.current.applyDayReplan(before, [change], date, "account-a")).toThrow(/dagen/);
    expect(state.writes).toBe(0);
  });
  it("reads the latest shared value and rejects concurrent changes atomically", () => {
    const { result } = renderHook(() => useTasks());
    const before = state.tasks;
    state.tasks = [{ ...before[0], completed: true }];
    expect(() => result.current.applyDayReplan(before, [change], date, "account-a")).toThrow(/ändrats/);
    expect(state.writes).toBe(0);
    expect(state.tasks[0]).toMatchObject({ completed: true, time: "14:00" });
  });
});
