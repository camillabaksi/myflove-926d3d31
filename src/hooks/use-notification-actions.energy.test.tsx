import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_DONE_EVENT, type ActivityDoneDetail } from "@/lib/activity-energy-event";
import { todayISO } from "@/lib/day";

const state = vi.hoisted(() => ({
  reminders: [
    { id: "repeat", title: "Ta en promenad", date: "2026-01-01", repeat: "daily", completed: false, time: "09:00" },
    { id: "once", title: "Hämta paket", date: "2026-10-22", repeat: "none", completed: false, time: "16:00" },
  ],
  completed: new Set<string>(),
  setInstanceDone: vi.fn(),
  toggleReminder: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn() }) }));
vi.mock("@/lib/push.functions", () => ({ syncReminder: vi.fn(async () => undefined) }));
vi.mock("@/lib/notification-actions", () => ({
  readNotificationActions: () => [],
  captureActionFromUrl: vi.fn(),
  clearNotificationActions: vi.fn(),
  shiftTime: (value: string) => value,
  SNOOZE_MINUTES: 10,
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: [], toggleTask: vi.fn(), setTaskTime: vi.fn() }),
  useReminders: () => ({ reminders: state.reminders, toggleReminder: state.toggleReminder, updateReminder: vi.fn() }),
  useMedications: () => ({ medications: [], isTaken: vi.fn(), toggleTaken: vi.fn() }),
}));
vi.mock("@/hooks/use-quickflow", () => ({
  useQuickflow: () => ({ items: [], complete: vi.fn(), snooze: vi.fn() }),
}));
vi.mock("@/hooks/use-instance-status", () => ({
  useInstanceStatus: () => ({
    isInstanceDone: (sourceId: string, date: string) => state.completed.has(`${sourceId}|${date}`),
    setInstanceDone: state.setInstanceDone,
  }),
}));

import { useNotificationActions } from "@/hooks/use-notification-actions";

describe("Energy feedback from notification completion", () => {
  let worker: EventTarget;
  const events: ActivityDoneDetail[] = [];
  const listener = (event: Event) => events.push((event as CustomEvent<ActivityDoneDetail>).detail);

  beforeEach(() => {
    worker = new EventTarget();
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: worker });
    state.completed.clear();
    state.setInstanceDone.mockReset();
    state.setInstanceDone.mockImplementation((id: string, date: string, done: boolean) => {
      if (done) state.completed.add(`${id}|${date}`);
    });
    state.toggleReminder.mockReset();
    state.reminders[0]!.completed = false;
    state.reminders[1]!.completed = false;
    events.length = 0;
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
  });

  afterEach(() => {
    window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
  });

  const actOn = (id: string) => {
    act(() => {
      worker.dispatchEvent(new MessageEvent("message", {
        data: { type: "myflove-notification-action", itemKey: `reminder:${id}`, action: "done" },
      }));
    });
  };

  it("completes only today's instance of a recurring reminder and asks once", () => {
    renderHook(() => useNotificationActions());
    actOn("repeat");
    const today = todayISO();
    expect(state.setInstanceDone).toHaveBeenCalledTimes(1);
    expect(state.setInstanceDone).toHaveBeenCalledWith("reminder-repeat", today, true);
    expect(state.completed.has(`reminder-repeat|${today}`)).toBe(true);
    expect(state.completed.size).toBe(1);
    expect(state.reminders[0]?.completed).toBe(false);
    expect(state.toggleReminder).not.toHaveBeenCalled();
    expect(events).toEqual([{ id: "rem-repeat", title: "Ta en promenad", dueDate: today }]);

    actOn("repeat"); // Replayed action must not prompt twice or edit the series.
    expect(state.setInstanceDone).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
  });

  it("uses the shared source function for a one-off reminder instead of emitting twice", () => {
    renderHook(() => useNotificationActions());
    actOn("once");
    expect(state.toggleReminder).toHaveBeenCalledOnce();
    expect(state.toggleReminder).toHaveBeenCalledWith("once");
    expect(state.setInstanceDone).not.toHaveBeenCalled();
    expect(events).toEqual([]); // The real useReminders source owns the energy event.
  });
});
