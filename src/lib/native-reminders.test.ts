import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
const mock = vi.hoisted(() => ({
  platform: "android",
  supported: true,
  owner: "A",
  permission: "granted",
  exact: "granted",
  consent: new Map<string, string>(),
  pending: [] as LocalNotificationSchema[],
  delivered: [] as LocalNotificationSchema[],
  schedule: vi.fn(),
  cancel: vi.fn(),
  request: vi.fn(),
  exactRequest: vi.fn(),
  channel: vi.fn(),
  quiet: { pausedUntil: 0, scheduleEnabled: false, scheduleStart: "22:00", scheduleEnd: "07:00" },
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isPluginAvailable: () => mock.supported } }));
vi.mock("./native-caps", () => ({
  isNativeShell: () => true,
  nativePlatform: () => mock.platform,
}));
vi.mock("./cloud-storage", () => ({
  getSyncUser: async () => (mock.owner ? { id: mock.owner } : null),
}));
vi.mock("./account-scope", () => ({ isActiveOwner: (id: string) => mock.owner === id }));
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: mock.consent.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => {
      mock.consent.set(key, value);
    },
  },
}));
vi.mock("@capacitor/app", () => ({ App: { addListener: async () => ({ remove: vi.fn() }) } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), getSession: vi.fn() } },
}));
vi.mock("./personalization", () => ({
  getAlarmSoundId: () => "harpa",
  getAlarmFormat: () => "bada",
}));
vi.mock("./push-notifications", () => ({ isAlarmSoundEnabled: () => true }));
vi.mock("./quiet-mode", async (original) => ({
  ...(await original<typeof import("./quiet-mode")>()),
  getQuietMode: () => mock.quiet,
}));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    getPending: async () => ({ notifications: [...mock.pending] }),
    getDeliveredNotifications: async () => ({ notifications: [...mock.delivered] }),
    removeDeliveredNotifications: async () => {
      mock.delivered = [];
    },
    checkPermissions: async () => ({ display: mock.permission }),
    requestPermissions: mock.request,
    checkExactNotificationSetting: async () => ({ exact_alarm: mock.exact }),
    changeExactNotificationSetting: mock.exactRequest,
    schedule: mock.schedule,
    cancel: mock.cancel,
    createChannel: mock.channel,
  },
}));
import {
  reconcileNativeReminders,
  nativeReminderPreferences,
  clearNativeReminders,
  enableNativeReminders,
  disableNativeReminders,
  scheduleNativeOneOff,
  requestNativeExactTimes,
  getNativeReminderStatus,
  nativeReminderDestination,
} from "./native-reminders";
import { nativeExtra } from "./native-reminder-plan";
import { isNativeReminderHandled, forgetNativeDeliveries } from "./native-reminder-delivery";
const reminder = (key = "task:one", minutes = 5) => ({
  clientKey: key,
  title: "Promenad",
  body: "Dags",
  deliverAt: new Date(Date.now() + minutes * 60_000).toISOString(),
  url: "/idag",
});
const sync = (rows = [reminder()]) =>
  reconcileNativeReminders("A", rows, nativeReminderPreferences(), () => mock.owner === "A");
beforeEach(() => {
  vi.clearAllMocks();
  mock.platform = "android";
  mock.supported = true;
  mock.owner = "A";
  mock.permission = "granted";
  mock.exact = "granted";
  mock.pending = [];
  mock.delivered = [];
  mock.quiet.pausedUntil = 0;
  mock.consent.clear();
  mock.consent.set("paceable-native-reminders-enabled:A", "true");
  mock.schedule.mockImplementation(
    async ({ notifications }: { notifications: LocalNotificationSchema[] }) => {
      for (const n of notifications)
        mock.pending = [...mock.pending.filter((p) => p.id !== n.id), n];
      return { notifications };
    },
  );
  mock.cancel.mockImplementation(async ({ notifications }: { notifications: { id: number }[] }) => {
    mock.pending = mock.pending.filter((n) => !notifications.some((p) => p.id === n.id));
  });
  mock.channel.mockResolvedValue(undefined);
  mock.request.mockResolvedValue({ display: "granted" });
  forgetNativeDeliveries();
});
describe("native reminder lifecycle", () => {
  it("schedules once, leaves unchanged alarms alone, and cancels edits/deletions", async () => {
    const original = reminder();
    await sync([original]);
    await sync([original]);
    expect(mock.schedule).toHaveBeenCalledTimes(1);
    await sync([{ ...original, title: "Ny titel" }]);
    expect(mock.cancel).toHaveBeenCalledTimes(1);
    expect(mock.schedule).toHaveBeenCalledTimes(2);
    await sync([]);
    expect(mock.pending).toEqual([]);
  });
  it.each(["consent", "permission", "exact"])(
    "automatic sync never opens permission dialogs when %s is missing",
    async (missing) => {
      if (missing === "consent") mock.consent.clear();
      if (missing === "permission") mock.permission = "denied";
      if (missing === "exact") mock.exact = "denied";
      await sync();
      expect(mock.schedule).not.toHaveBeenCalled();
      expect(mock.request).not.toHaveBeenCalled();
      expect(mock.exactRequest).not.toHaveBeenCalled();
    },
  );
  it("keeps explicit opt-in per account and removes A's alarms on B without touching others", async () => {
    await sync();
    mock.pending.push({ id: 10, title: "Another plugin", body: "" });
    mock.owner = "B";
    await reconcileNativeReminders(
      "B",
      [reminder("task:B")],
      nativeReminderPreferences(),
      () => true,
    );
    expect(mock.pending).toEqual([{ id: 10, title: "Another plugin", body: "" }]);
    expect((await getNativeReminderStatus()).enabled).toBe(false);
  });
  it("cleans accepted alarms if sign-out happens while the native bridge is busy", async () => {
    let finish: (() => void) | undefined;
    mock.schedule.mockImplementationOnce(
      async ({ notifications }: { notifications: LocalNotificationSchema[] }) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        mock.pending.push(...notifications);
      },
    );
    const run = sync();
    await vi.waitFor(() => expect(finish).toBeDefined());
    mock.owner = "";
    const logout = clearNativeReminders();
    finish!();
    await Promise.all([run, logout]);
    expect(mock.pending).toEqual([]);
  });
  it("supports iOS without requesting Android exact-alarm settings", async () => {
    mock.platform = "ios";
    mock.exact = "denied";
    await sync();
    expect(mock.schedule).toHaveBeenCalledTimes(1);
    await requestNativeExactTimes();
    expect(mock.exactRequest).not.toHaveBeenCalled();
  });
  it("does not inherit OS authorization as user consent, and disable clears the queue", async () => {
    mock.consent.clear();
    await enableNativeReminders();
    expect(mock.request).toHaveBeenCalledTimes(1);
    await sync();
    expect(mock.pending).toHaveLength(1);
    await disableNativeReminders();
    expect(mock.pending).toEqual([]);
    expect((await getNativeReminderStatus()).enabled).toBe(false);
  });
  it("preserves tests/snoozes across refills, respects later quiet changes and cancels taken doses", async () => {
    const source = reminder("med:one:2026-10-11:14:00", -10);
    await scheduleNativeOneOff(reminder("med:one:snooze:14:00", 10), source.clientKey);
    await scheduleNativeOneOff(reminder("native-test", 1));
    const ids = mock.pending.map((n) => n.id);
    await sync([source]);
    expect(mock.pending.map((n) => n.id)).toEqual(ids);
    mock.quiet.pausedUntil = Date.now() + 3600_000;
    await sync([source]);
    expect(
      mock.pending.every((n) => Date.parse(nativeExtra(n)!.scheduledAt) === mock.quiet.pausedUntil),
    ).toBe(true);
    await sync([]);
    expect(mock.pending).toHaveLength(1);
    expect(nativeExtra(mock.pending[0])?.clientKey).toBe("native-test");
  });
  it("deduplicates the foreground alarm only at the accepted time and for the active owner", async () => {
    const due = reminder("rem:calendar", 0.1);
    await sync([due]);
    expect(isNativeReminderHandled("reminder:calendar", Date.parse(due.deliverAt))).toBe(true);
    expect(isNativeReminderHandled("reminder:calendar", Date.parse(due.deliverAt) + 60_000)).toBe(
      false,
    );
    mock.owner = "B";
    expect(isNativeReminderHandled("reminder:calendar", Date.parse(due.deliverAt))).toBe(false);
  });
  it("propagates scheduling failures so the shared retry can recover", async () => {
    mock.schedule.mockRejectedValueOnce(new Error("bridge failed"));
    await expect(sync()).rejects.toThrow("bridge failed");
    await sync();
    expect(mock.pending).toHaveLength(1);
  });
});

it("preserves unreadable local or unavailable authorized family sources until they load", async () => {
  await sync([reminder("task:one"), reminder("child-item:one")]);
  await reconcileNativeReminders("A", [], nativeReminderPreferences(), () => true, [
    "task:",
    "child-item:",
  ]);
  expect(mock.pending).toHaveLength(2);
  expect(mock.schedule).toHaveBeenCalledTimes(1);
  await sync([]);
  expect(mock.pending).toEqual([]);
});

it("only opens authenticated same-origin routes when a notification is tapped", async () => {
  await sync();
  const extra = nativeExtra(mock.pending[0])!;
  expect(nativeReminderDestination(extra)).toBe("/idag");
  expect(nativeReminderDestination({ ...extra, url: "//other.example/private" })).toBeNull();
  expect(nativeReminderDestination({ ...extra, url: "/\\other.example/private" })).toBeNull();
  mock.owner = "B";
  expect(nativeReminderDestination(extra)).toBeNull();
});
