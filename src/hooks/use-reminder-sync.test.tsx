import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder } from "./use-data";

const mocks = vi.hoisted(() => ({
  reminders: [] as Reminder[],
  subscribed: false,
  signedIn: true,
  getUser: vi.fn(),
  sync: vi.fn(),
  cancel: vi.fn(),
  reconcile: vi.fn(),
  getSubscription: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: [] }),
  useMedications: () => ({ medications: [], isTaken: () => false, ready: true }),
  useReminders: () => ({ reminders: mocks.reminders }),
}));
vi.mock("@/lib/push.functions", () => ({
  syncReminder: mocks.sync,
  cancelReminder: mocks.cancel,
  reconcileReminders: mocks.reconcile,
}));
vi.mock("@/lib/push-client", () => ({
  getCurrentSubscription: mocks.getSubscription,
  refreshPushSubscription: async () => null,
  PUSH_SUBSCRIPTION_EVENT: "test-push-changed",
}));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: (_key: string, initial: unknown) => [initial],
}));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ openItems: [] }) }));
vi.mock("@/hooks/use-study-schedule", () => ({
  useStudySchedule: () => ({ lectures: [], settings: { lectureReminderMinutes: 0 } }),
}));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({ children: [], items: [] }) }));
vi.mock("@/lib/child-reminders", () => ({
  useChildReminderSettings: () => ({ settings: { enabled: false } }),
}));
vi.mock("@/lib/adaptive-lead", () => ({
  useAdaptiveLead: () => ({ state: undefined }),
  applyAdaptiveLead: (lead: number) => lead,
}));

import { useReminderSync } from "./use-reminder-sync";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.subscribed = false;
  mocks.signedIn = true;
  mocks.getUser.mockImplementation(async () => ({
    data: { user: mocks.signedIn ? { id: "test-account" } : null },
  }));
  mocks.getSubscription.mockImplementation(async () =>
    mocks.subscribed ? { endpoint: "https://push.test/android" } : null,
  );
  mocks.sync.mockResolvedValue({ ok: true });
  mocks.cancel.mockResolvedValue({ ok: true });
  mocks.reconcile.mockResolvedValue({ canceled: 0 });
  const when = new Date(Date.now() + 20 * 60_000);
  mocks.reminders = [
    {
      id: "test-reminder",
      title: "TEST",
      completed: false,
      canceled: false,
      date: `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}`,
      time: `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`,
      repeat: "none",
      remindMinutesBefore: 0,
    } as Reminder,
  ];
});

describe("köning av påminnelser efter aktivering", () => {
  it("synkar befintliga påminnelser direkt när push har registrerats", async () => {
    renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.getSubscription).toHaveBeenCalledOnce());
    expect(mocks.sync).not.toHaveBeenCalled();
    mocks.subscribed = true;
    act(() => window.dispatchEvent(new Event("test-push-changed")));
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledOnce());
    expect(mocks.sync).toHaveBeenCalledWith({
      data: expect.objectContaining({ clientKey: "rem:test-reminder", title: "🔔 TEST" }),
    });
  });

  it("avbokar en köad påminnelse direkt när den avbryts", async () => {
    mocks.subscribed = true;
    const { rerender } = renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledOnce());
    mocks.reminders = [{ ...mocks.reminders[0], canceled: true }];
    rerender();
    await waitFor(() =>
      expect(mocks.cancel).toHaveBeenCalledWith({ data: { clientKey: "rem:test-reminder" } }),
    );
  });

  it("uppdaterar tid och rubrik när framförhållningen ändras", async () => {
    mocks.subscribed = true;
    const { rerender } = renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledOnce());
    const original = mocks.sync.mock.calls[0][0].data.deliverAt;
    mocks.reminders = [{ ...mocks.reminders[0], title: "Ändrad", remindMinutesBefore: 5 }];
    rerender();
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledTimes(2));
    const changed = mocks.sync.mock.calls[1][0].data;
    expect(changed.title).toBe("🔔 Om 5 min: Ändrad");
    expect(new Date(original).getTime() - new Date(changed.deliverAt).getTime()).toBe(5 * 60_000);
  });

  it("köar inget utan inloggning även vid en registreringssignal", async () => {
    mocks.signedIn = false;
    mocks.subscribed = true;
    renderHook(() => useReminderSync());
    act(() => window.dispatchEvent(new Event("test-push-changed")));
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalledTimes(2));
    expect(mocks.getSubscription).not.toHaveBeenCalled();
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});
