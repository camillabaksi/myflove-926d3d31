import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task, Reminder } from "./use-data";

const mocks = vi.hoisted(() => ({
  tasks: [] as Task[],
  reminders: [] as Reminder[],
  send: vi.fn(),
}));
vi.mock("./use-data", () => ({
  useTasks: () => ({ tasks: mocks.tasks }),
  useReminders: () => ({ reminders: mocks.reminders }),
}));
vi.mock("../lib/push-notifications", () => ({
  sendPushNotification: mocks.send,
  getNotificationPermission: () => "unsupported",
}));
import { useNotificationScheduler } from "./use-notification-scheduler";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 11, 13, 0));
  mocks.tasks = [];
  mocks.reminders = [];
});
afterEach(() => vi.useRealTimers());
describe("larm i öppen app utan stöd för systemnotiser", () => {
  it("låter en självvald påminnelse nå ljudmotorn en gång", () => {
    mocks.tasks = [
      {
        id: "one",
        title: "Test",
        time: "13:00",
        dueDate: "2026-10-11",
        reminderMinutesBefore: 0,
      } as Task,
    ];
    renderHook(() => useNotificationScheduler());
    vi.advanceTimersByTime(30_000);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ itemKey: "task:one" }),
    );
  });
  it("larmar inte för vanliga uppgifter, klara aktiviteter eller avbokade påminnelser", () => {
    mocks.tasks = [
      { id: "ordinary", time: "13:00", dueDate: "2026-10-11" },
      {
        id: "done",
        time: "13:00",
        dueDate: "2026-10-11",
        reminderMinutesBefore: 0,
        completed: true,
      },
    ] as Task[];
    mocks.reminders = [
      { id: "canceled", date: "2026-10-11", time: "13:00", canceled: true } as Reminder,
    ];
    renderHook(() => useNotificationScheduler());
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
