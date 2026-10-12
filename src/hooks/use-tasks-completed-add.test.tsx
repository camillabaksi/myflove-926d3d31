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
