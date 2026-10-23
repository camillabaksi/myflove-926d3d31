import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { ACTIVITY_DONE_EVENT, type ActivityDoneDetail } from "@/lib/activity-energy-event";

vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/flow-signal", () => ({ flowDone: vi.fn() }));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));
import { useTasks } from "./use-data";

describe("manual completed task creation", () => {
  it("creates at most one activity for the same Pace action, even across synchronous double clicks", () => {
    const { result, rerender } = renderHook(() => useTasks());
    const sameMessage = "pace-action-8734a390-b95c-4981-9c5d-1298534245a2-0";
    const differentMessage = "pace-action-5ed34332-4619-4e95-8107-130eaa87fc4b-0";
    act(() => {
      result.current.addTask("Handla", "2026-10-23", { id: sameMessage });
      result.current.addTask("Handla", "2026-10-23", { id: sameMessage });
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toMatchObject({ id: sameMessage, dueDate: "2026-10-23" });
    rerender();
    act(() => result.current.addTask("Handla", "2026-10-23", { id: sameMessage }));
    expect(result.current.tasks).toHaveLength(1);
    act(() => result.current.addTask("Handla", "2026-10-23", { id: differentMessage }));
    expect(result.current.tasks).toHaveLength(2);
    expect(new Set(result.current.tasks.map(task => task.id)).size).toBe(2);
  });

  it("keeps QuickFlow's established upsert behavior for its own recurring hydration", () => {
    const { result } = renderHook(() => useTasks());
    act(() => result.current.addTask("Gammalt namn", "2026-10-23", { id: "from-quickflow", quickflowId: "quickflow-1" }));
    act(() => result.current.addTask("Nytt namn", "2026-10-24", { id: "from-quickflow", quickflowId: "quickflow-1" }));
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toMatchObject({ title: "Nytt namn", dueDate: "2026-10-23" });
  });

  it("uses one shared energy event when a planned task is completed and none when reopened", () => {
    const events: ActivityDoneDetail[] = [];
    const listener = (event: Event) => events.push((event as CustomEvent<ActivityDoneDetail>).detail);
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
    try {
      const { result } = renderHook(() => useTasks());
      act(() => result.current.addTask("Handla", "2026-10-22"));
      const task = result.current.tasks[0]!;
      expect(events).toHaveLength(0); // planning itself never changes the battery

      act(() => result.current.toggleTask(task.id));
      expect(result.current.tasks[0]?.completed).toBe(true);
      expect(events).toEqual([{ id: `task-${task.id}`, title: "Handla", dueDate: "2026-10-22" }]);

      act(() => result.current.toggleTask(task.id));
      expect(result.current.tasks[0]?.completed).toBe(false);
      expect(events).toHaveLength(1);
    } finally {
      window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
    }
  });

  it("asks about a newly completed activity immediately, retaining its id and chosen date", () => {
    const events: ActivityDoneDetail[] = [];
    const listener = (event: Event) => events.push((event as CustomEvent<ActivityDoneDetail>).detail);
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
    try {
      const { result } = renderHook(() => useTasks());
      act(() => result.current.addTask("Byggde ihop en hylla", "2026-10-12", { completed: true }));
      const task = result.current.tasks[0];
      expect(task.completed).toBe(true);
      expect(events).toEqual([{ id: `task-${task.id}`, title: task.title, dueDate: "2026-10-12" }]);
      act(() => result.current.addTask("Nästa hylla", "2026-10-13"));
      act(() => result.current.addTask("Återställd post", "2026-10-12", { quickflowId: "existing", completed: true }));
      expect(events).toHaveLength(1);
    } finally {
      window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
    }
  });
});
