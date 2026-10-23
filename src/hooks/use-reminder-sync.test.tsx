import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder, Task } from "./use-data";

const mocks = vi.hoisted(() => ({
  reminders: [] as Reminder[],
  tasks: [] as Task[],
  activeOwner: true,
  native: false,
  nativeSync: vi.fn(),
  subscribed: false,
  signedIn: true,
  getUser: vi.fn(),
  sync: vi.fn(),
  cancel: vi.fn(),
  reconcile: vi.fn(),
  getSubscription: vi.fn(),
}));
vi.mock("@/lib/native-caps", () => ({ isNativeShell: () => mocks.native }));
vi.mock("@/lib/native-reminders", () => ({
  nativeRemindersSupported: () => true,
  lockedNativeReminderPrefixes: () => [],
  reconcileNativeReminders: mocks.nativeSync,
  nativeReminderPreferences: () => ({}),
  NATIVE_REMINDERS_EVENT: "test-native-changed",
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: mocks.tasks }),
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
  getSyncUser: mocks.getUser,
  ACCOUNT_BOUND_EVENT: "test-account-bound",
}));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: () => mocks.activeOwner }));
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
  mocks.native = false;
  mocks.nativeSync.mockResolvedValue(undefined);
  mocks.signedIn = true;
  mocks.activeOwner = true;
  mocks.tasks = [];
  mocks.getUser.mockImplementation(async () => (mocks.signedIn ? { id: "test-account" } : null));
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

  it("schedules a moved occurrence under its original key on the new day without modifying later repeats", async () => {
    mocks.subscribed = true;
    const original = new Date();
    original.setHours(0, 0, 0, 0);
    const movedTo = new Date(original);
    movedTo.setDate(movedTo.getDate() + 1);
    const when = new Date(movedTo);
    when.setHours(16, 30, 0, 0);
    const originalDate = mocksDate(original);
    const targetDate = mocksDate(movedTo);
    mocks.reminders = [{
      id: "repeat", title: "Promenad", date: originalDate, time: "09:00",
      completed: false, createdAt: 1, repeat: "daily", remindMinutesBefore: 0,
      occurrenceOverrides: { [originalDate]: { date: targetDate, time: "16:30" } },
    }];
    renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledOnce());
    const values = mocks.sync.mock.calls.map(([arg]) => arg.data);
    const moved = values.find(value => value.clientKey === `rem:repeat:${originalDate}`);
    expect(moved).toBeDefined();
    expect(new Date(moved.deliverAt).getTime()).toBe(when.getTime());
    expect(moved.body).toBe("Påminnelse kl 16:30");
    expect(values.find(value => value.clientKey === `rem:repeat:${targetDate}`)?.body)
      .toBe("Påminnelse kl 09:00");
    expect(values.some(value => value.clientKey === `rem:repeat:${originalDate}` &&
      value.body === "Påminnelse kl 09:00")).toBe(false);
  });

  it("projects the same moved occurrence to the native queue with an origin key", async () => {
    mocks.native = true;
    const origin = new Date();
    origin.setHours(0, 0, 0, 0);
    const target = new Date(origin);
    target.setDate(target.getDate() + 1);
    const originalDate = mocksDate(origin);
    const destination = mocksDate(target);
    mocks.reminders = [{
      id: "repeat", title: "Promenad", date: originalDate, time: "09:00",
      completed: false, createdAt: 1, repeat: "daily", remindMinutesBefore: 0,
      occurrenceOverrides: { [originalDate]: { date: destination, time: "16:30" } },
    }];
    renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.nativeSync).toHaveBeenCalledOnce());
    const planned = mocks.nativeSync.mock.calls[0][1] as Array<{ clientKey: string; body: string }>;
    expect(planned).toEqual(expect.arrayContaining([
      expect.objectContaining({ clientKey: `rem:repeat:${originalDate}`, body: "Påminnelse kl 16:30" }),
      expect.objectContaining({ clientKey: `rem:repeat:${destination}`, body: "Påminnelse kl 09:00" }),
    ]));
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
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalled());
    expect(mocks.getSubscription).not.toHaveBeenCalled();
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it("köar och uppdaterar uppgifter utan att påminnelsesidan är monterad", async () => {
    mocks.subscribed = true;
    mocks.reminders = [];
    const when = new Date(Date.now() + 20 * 60_000);
    mocks.tasks = [
      {
        id: "task-one",
        title: "Första rubrik",
        completed: false,
        dueDate: mocksDate(when),
        time: mocksTime(when),
        reminderMinutesBefore: 0,
      } as Task,
    ];
    const { rerender } = renderHook(() => useReminderSync());
    await waitFor(() =>
      expect(mocks.sync).toHaveBeenCalledWith({
        data: expect.objectContaining({ clientKey: "task:task-one", title: "Första rubrik" }),
      }),
    );
    mocks.tasks = [{ ...mocks.tasks[0], title: "Ny rubrik" }];
    rerender();
    await waitFor(() =>
      expect(mocks.sync).toHaveBeenCalledWith({
        data: expect.objectContaining({ clientKey: "task:task-one", title: "Ny rubrik" }),
      }),
    );
  });

  it("behåller en förfallen men aktiv påminnelse för serverns återförsök", async () => {
    mocks.subscribed = true;
    const when = new Date(Date.now() - 5 * 60_000);
    const { rerender } = renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledOnce());
    mocks.reminders = [{ ...mocks.reminders[0], date: mocksDate(when), time: mocksTime(when) }];
    rerender();
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledTimes(2));
    expect(mocks.cancel).not.toHaveBeenCalled();
    expect(mocks.sync).toHaveBeenCalledOnce();
  });

  it("skickar aldrig lokal data som tillhör ett annat konto", async () => {
    mocks.subscribed = true;
    mocks.activeOwner = false;
    renderHook(() => useReminderSync());
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalled());
    expect(mocks.getSubscription).not.toHaveBeenCalled();
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});

function mocksDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function mocksTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

it("uses the OS queue in native apps without requiring or writing a web-push subscription", async () => {
  mocks.native = true;
  renderHook(useReminderSync);
  await waitFor(() => expect(mocks.nativeSync).toHaveBeenCalledOnce());
  expect(mocks.nativeSync).toHaveBeenCalledWith(
    "test-account",
    expect.arrayContaining([
      expect.objectContaining({
        clientKey: "rem:test-reminder",
        title: "🔔 TEST",
        url: "/kalender",
      }),
    ]),
    {},
    expect.any(Function),
    [],
  );
  expect(mocks.getSubscription).not.toHaveBeenCalled();
  expect(mocks.sync).not.toHaveBeenCalled();
  expect(mocks.reconcile).not.toHaveBeenCalled();
});
it("refills the native queue on app resume and keeps the owner check", async () => {
  mocks.native = true;
  renderHook(useReminderSync);
  await waitFor(() => expect(mocks.nativeSync).toHaveBeenCalledOnce());
  act(() => window.dispatchEvent(new Event("test-native-changed")));
  await waitFor(() => expect(mocks.nativeSync).toHaveBeenCalledTimes(2));
  mocks.activeOwner = false;
  act(() => window.dispatchEvent(new Event("test-native-changed")));
  await act(async () => {});
  expect(mocks.nativeSync).toHaveBeenCalledTimes(2);
});
