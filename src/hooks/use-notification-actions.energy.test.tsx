import { act, renderHook, waitFor } from "@testing-library/react";
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
  updateReminder: vi.fn(),
  syncReminder: vi.fn(async (_args: unknown) => ({ ok: true })),
  scheduleNativeOneOff: vi.fn(async (_args: unknown, _sourceKey?: string) => true),
  nativeSupported: false,
}));

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/lib/push.functions", () => ({ syncReminder: state.syncReminder }));
vi.mock("@/lib/native-reminders", () => ({
  nativeRemindersSupported: () => state.nativeSupported,
  scheduleNativeOneOff: state.scheduleNativeOneOff,
}));
vi.mock("@/lib/notification-actions", () => ({
  readNotificationActions: () => [],
  captureActionFromUrl: vi.fn(),
  clearNotificationActions: vi.fn(),
  shiftTime: (value: string) => value,
  SNOOZE_MINUTES: 10,
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: [], toggleTask: vi.fn(), setTaskTime: vi.fn() }),
  useReminders: () => ({ reminders: state.reminders, toggleReminder: state.toggleReminder, updateReminder: state.updateReminder }),
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
    state.updateReminder.mockReset();
    state.syncReminder.mockClear();
    state.scheduleNativeOneOff.mockClear();
    state.nativeSupported = false;
    state.reminders[0]!.completed = false;
    state.reminders[1]!.completed = false;
    events.length = 0;
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
  });

  afterEach(() => {
    window.removeEventListener(ACTIVITY_DONE_EVENT, listener);
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
  });

  const actOn = (id: string, action: "done" | "snooze" = "done", date?: string) => {
    act(() => {
      worker.dispatchEvent(new MessageEvent("message", {
        data: { type: "myflove-notification-action", itemKey: `reminder:${id}${date ? `:${date}` : ""}`, action },
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

  it("marks the notification's own day, never the day the app was reopened", () => {
    renderHook(() => useNotificationActions());
    actOn("repeat", "done", "2026-10-21");
    expect(state.setInstanceDone).toHaveBeenCalledWith("reminder-repeat", "2026-10-21", true);
    expect(events).toEqual([{ id: "rem-repeat", title: "Ta en promenad", dueDate: "2026-10-21" }]);
    expect(state.updateReminder).not.toHaveBeenCalled();
  });

  it("snoozes only one recurring occurrence in web push without changing the master", async () => {
    renderHook(() => useNotificationActions());
    actOn("repeat", "snooze", "2026-10-22");
    await waitFor(() => expect(state.syncReminder).toHaveBeenCalledOnce());
    const call = state.syncReminder.mock.calls[0]?.[0] as { data: { clientKey: string; kind: string; deliverAt: string } };
    expect(call.data.clientKey).toMatch(/^rem:repeat:2026-10-22:snooze:\d+$/);
    expect(call.data.kind).toBe("custom");
    expect(Date.parse(call.data.deliverAt)).toBeGreaterThan(Date.now());
    expect(state.updateReminder).not.toHaveBeenCalled();
    expect(state.setInstanceDone).not.toHaveBeenCalled();
  });

  it("keeps native snoozes transient and tied to the original occurrence", async () => {
    state.nativeSupported = true;
    renderHook(() => useNotificationActions());
    actOn("repeat", "snooze", "2026-10-22");
    await waitFor(() => expect(state.scheduleNativeOneOff).toHaveBeenCalledOnce());
    expect(state.scheduleNativeOneOff.mock.calls[0]?.[1]).toBe("rem:repeat:2026-10-22");
    expect(state.syncReminder).not.toHaveBeenCalled();
    expect(state.updateReminder).not.toHaveBeenCalled();
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
