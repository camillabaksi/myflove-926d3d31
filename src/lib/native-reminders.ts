import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { isNativeShell, nativePlatform } from "./native-caps";
import { getSyncUser } from "./cloud-storage";
import { secureGetItem } from "./secure-local";
import { isActiveOwner } from "./account-scope";
import { supabase } from "@/integrations/supabase/client";
import { getQuietMode, isQuietNow } from "./quiet-mode";
import { getAlarmFormat, getAlarmSoundId } from "./personalization";
import { isAlarmSoundEnabled } from "./push-notifications";
import {
  buildNativeReminderPlan,
  nativeAlarmChannel,
  nativeExtra,
  type DeviceReminder,
  type NativeReminderPreferences,
  type NativeReminderExtra,
} from "./native-reminder-plan";
import {
  forgetNativeDeliveries,
  rememberNativeDelivery,
  isNativeReminderHandled,
} from "./native-reminder-delivery";

export const NATIVE_REMINDERS_EVENT = "paceable-native-reminders-changed";
let operations: Promise<unknown> = Promise.resolve();
let epoch = 0;
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = operations.then(fn, fn);
  operations = run.catch(() => undefined);
  return run;
}
export function nativeRemindersSupported(): boolean {
  return isNativeShell() && Capacitor.isPluginAvailable("LocalNotifications");
}
function changed(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NATIVE_REMINDERS_EVENT));
}
function consentKey(ownerId: string): string {
  return `paceable-native-reminders-enabled:${ownerId}`;
}
async function enabledFor(ownerId: string): Promise<boolean> {
  return (await Preferences.get({ key: consentKey(ownerId) })).value === "true";
}
/** Do not treat encrypted-but-unreadable local stores as deliberate deletions. */
export function lockedNativeReminderPrefixes(): string[] {
  const stores: [string, string[]][] = [
    ["myflow-tasks", ["task:", "deadline:"]],
    ["myflow-reminders", ["rem:"]],
    ["myflove-medications", ["med:"]],
    ["myflove-medication-log", ["med:"]],
    ["myflove-routines", ["routine:"]],
    ["myflove-quickflow", ["quickflow:"]],
    ["myflove-study-lectures", ["lecture:"]],
    ["myflove-child-schedules", ["child-schedule:", "child-day:"]],
  ];
  return stores.flatMap(([key, prefixes]) => {
    try {
      return window.localStorage.getItem(key)?.startsWith("enc:v1:") && secureGetItem(key) === null
        ? prefixes
        : [];
    } catch {
      return prefixes;
    }
  });
}
export function nativeReminderPreferences(): NativeReminderPreferences {
  return {
    quiet: getQuietMode(),
    sound: getAlarmSoundId(),
    format: getAlarmFormat(),
    soundEnabled: isAlarmSoundEnabled(),
  };
}
async function exactPermission(): Promise<boolean> {
  return (
    nativePlatform() !== "android" ||
    (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === "granted"
  );
}
export interface NativeReminderStatus {
  supported: boolean;
  enabled: boolean;
  permission: string;
  exact: boolean;
  count: number;
}
export async function getNativeReminderStatus(): Promise<NativeReminderStatus> {
  const empty = {
    supported: nativeRemindersSupported(),
    enabled: false,
    permission: "prompt",
    exact: false,
    count: 0,
  };
  if (!empty.supported) return empty;
  const user = await getSyncUser();
  if (!user) return empty;
  const [permission, exact, enabled, pending] = await Promise.all([
    LocalNotifications.checkPermissions(),
    exactPermission(),
    enabledFor(user.id),
    LocalNotifications.getPending(),
  ]);
  if (!isActiveOwner(user.id)) return empty;
  return {
    supported: true,
    permission: permission.display,
    exact,
    enabled,
    count: pending.notifications.filter((n) => nativeExtra(n)?.ownerId === user.id).length,
  };
}
/** Called only from a deliberate tap, never during automatic queue reconciliation. */
export async function enableNativeReminders(): Promise<void> {
  if (!nativeRemindersSupported()) return;
  const user = await getSyncUser();
  if (!user) return;
  const permission = await LocalNotifications.requestPermissions();
  if (!isActiveOwner(user.id) || permission.display !== "granted") return;
  await Preferences.set({ key: consentKey(user.id), value: "true" });
  changed();
}
export async function requestNativeExactTimes(): Promise<void> {
  if (nativeRemindersSupported() && nativePlatform() === "android") {
    await LocalNotifications.changeExactNotificationSetting();
    changed();
  }
}
/** All native writes are serialized, including sign-out while schedule() is awaiting the bridge. */
export function clearNativeReminders(keepOwnerId?: string, onlyOwnerId?: string): Promise<void> {
  if (!nativeRemindersSupported()) return Promise.resolve();
  epoch++;
  forgetNativeDeliveries();
  return serial(async () => {
    const pending = (await LocalNotifications.getPending()).notifications.filter((n) => {
      const e = nativeExtra(n);
      return e && e.ownerId !== keepOwnerId && (!onlyOwnerId || e.ownerId === onlyOwnerId);
    });
    if (pending.length)
      await LocalNotifications.cancel({ notifications: pending.map(({ id }) => ({ id })) });
    const delivered = (await LocalNotifications.getDeliveredNotifications()).notifications.filter(
      (n) => {
        const e = nativeExtra(n);
        return e && e.ownerId !== keepOwnerId && (!onlyOwnerId || e.ownerId === onlyOwnerId);
      },
    );
    if (delivered.length)
      await LocalNotifications.removeDeliveredNotifications({ notifications: delivered });
    changed();
  });
}
export async function disableNativeReminders(): Promise<void> {
  const user = await getSyncUser();
  if (!user || !nativeRemindersSupported()) return;
  epoch++;
  await Preferences.set({ key: consentKey(user.id), value: "false" });
  await clearNativeReminders(undefined, user.id);
}

export function reconcileNativeReminders(
  ownerId: string,
  reminders: readonly DeviceReminder[],
  prefs: NativeReminderPreferences,
  isCurrent: () => boolean,
  preservePrefixes: readonly string[] = [],
): Promise<void> {
  const started = epoch;
  const current = () => started === epoch && isCurrent() && isActiveOwner(ownerId);
  return serial(async () => {
    if (!nativeRemindersSupported() || !current()) return;
    let pending = (await LocalNotifications.getPending()).notifications;
    const foreign = pending.filter((n) => {
      const e = nativeExtra(n);
      return e && e.ownerId !== ownerId;
    });
    if (!current()) return;
    if (foreign.length)
      await LocalNotifications.cancel({ notifications: foreign.map(({ id }) => ({ id })) });
    pending = pending.filter((n) => !foreign.includes(n));
    const allowed =
      (await enabledFor(ownerId)) &&
      (await LocalNotifications.checkPermissions()).display === "granted" &&
      (await exactPermission());
    if (!current()) return;
    if (!allowed) {
      const own = pending.filter((n) => nativeExtra(n)?.ownerId === ownerId);
      if (own.length)
        await LocalNotifications.cancel({ notifications: own.map(({ id }) => ({ id })) });
      forgetNativeDeliveries();
      return;
    }
    const delivered = (await LocalNotifications.getDeliveredNotifications()).notifications;
    if (!current()) return;
    const preserved = pending.filter((n) => {
      const e = nativeExtra(n);
      return (
        e?.ownerId === ownerId &&
        !e.transient &&
        preservePrefixes.some((p) => e.clientKey.startsWith(p))
      );
    });
    const currentReminders = [
      ...reminders.filter((r) => !preservePrefixes.some((p) => r.clientKey.startsWith(p))),
      ...preserved.map((n) => {
        const e = nativeExtra(n)!;
        return {
          clientKey: e.clientKey,
          title: n.title,
          body: n.body ?? "",
          deliverAt: e.deliverAt,
          url: e.url,
        };
      }),
    ];
    const sourceKeys = new Set(currentReminders.map((r) => r.clientKey));
    const oneOffs = pending.filter((n) => {
      const e = nativeExtra(n);
      return (
        e?.ownerId === ownerId &&
        e.transient &&
        (!e.sourceKey ||
          sourceKeys.has(e.sourceKey) ||
          preservePrefixes.some((p) => e.sourceKey!.startsWith(p)))
      );
    });
    const transientByKey = new Map(
      oneOffs.map((n) => {
        const e = nativeExtra(n)!;
        return [e.clientKey, e];
      }),
    );
    const plan = buildNativeReminderPlan(
      ownerId,
      [
        ...currentReminders,
        ...oneOffs.map((n) => {
          const e = nativeExtra(n)!;
          return {
            clientKey: e.clientKey,
            title: n.title,
            body: n.body ?? "",
            deliverAt: e.deliverAt,
            url: e.url,
          };
        }),
      ],
      prefs,
      Date.now(),
      pending,
    );
    for (const n of plan) {
      const e = nativeExtra(n)!;
      const old = transientByKey.get(e.clientKey);
      if (old) n.extra = { ...e, transient: true, sourceKey: old.sourceKey, itemKey: old.itemKey };
    }
    const wanted = new Map(plan.map((n) => [n.id, n]));
    const stale = pending.filter((n) => {
      const e = nativeExtra(n);
      if (!e || e.ownerId !== ownerId) return false;
      return e.fingerprint !== nativeExtra(wanted.get(n.id) ?? {})?.fingerprint;
    });
    if (stale.length)
      await LocalNotifications.cancel({ notifications: stale.map(({ id }) => ({ id })) });
    if (!current()) return;
    const unchanged = new Set(pending.filter((n) => !stale.includes(n)).map((n) => n.id));
    const additions = plan.filter((n) => !unchanged.has(n.id));
    if (additions.length) {
      if (nativePlatform() === "android")
        await LocalNotifications.createChannel(nativeAlarmChannel(prefs));
      if (!current()) return;
      await LocalNotifications.schedule({ notifications: additions });
      // An account switch or edit during an asynchronous bridge call invalidates that entire write.
      if (!current()) {
        await LocalNotifications.cancel({ notifications: additions.map(({ id }) => ({ id })) });
        return;
      }
    }
    rememberNativeDelivery([...plan, ...delivered]);
    if (stale.length || additions.length || foreign.length) changed();
  });
}

/** One-off test/snooze survives regular refills, but never account changes or completed medication. */
export function scheduleNativeOneOff(
  reminder: DeviceReminder,
  sourceKey?: string,
): Promise<boolean> {
  const started = epoch;
  return serial(async () => {
    const user = await getSyncUser();
    if (!user || !nativeRemindersSupported() || !isActiveOwner(user.id) || started !== epoch)
      return false;
    const status = await getNativeReminderStatus();
    if (!status.enabled || status.permission !== "granted" || !status.exact || started !== epoch)
      return false;
    const prefs = nativeReminderPreferences();
    const pending = (await LocalNotifications.getPending()).notifications;
    if (
      pending.length >= 64 &&
      !pending.some((n) => {
        const e = nativeExtra(n);
        return e?.ownerId === user.id && e.clientKey === reminder.clientKey;
      })
    )
      return false;
    const plan = buildNativeReminderPlan(user.id, [reminder], prefs, Date.now(), pending);
    if (!plan.length || !isActiveOwner(user.id) || started !== epoch) return false;
    const notification = plan[0];
    notification.extra = {
      ...nativeExtra(notification),
      transient: true,
      ...(sourceKey ? { sourceKey, itemKey: sourceKey } : {}),
    };
    if (nativePlatform() === "android")
      await LocalNotifications.createChannel(nativeAlarmChannel(prefs));
    if (!isActiveOwner(user.id) || started !== epoch) return false;
    await LocalNotifications.schedule({ notifications: [notification] });
    if (!isActiveOwner(user.id) || started !== epoch) {
      await LocalNotifications.cancel({ notifications: [{ id: notification.id }] });
      return false;
    }
    rememberNativeDelivery([notification], false);
    changed();
    return true;
  });
}
export async function testNativeReminder(): Promise<boolean> {
  if (isQuietNow())
    throw new Error("Påminnelser är pausade. Avsluta tyst läge för att testa notisen.");
  return scheduleNativeOneOff({
    clientKey: "native-test",
    title: "Paceable 🌿",
    body: "Din testpåminnelse är framme.",
    deliverAt: new Date(Date.now() + 10_000).toISOString(),
    url: "/idag",
  });
}

export async function nativeForegroundHandled(itemKey: string): Promise<boolean> {
  if (!nativeRemindersSupported()) return false;
  const [pending, delivered] = await Promise.all([
    LocalNotifications.getPending(),
    LocalNotifications.getDeliveredNotifications(),
  ]);
  rememberNativeDelivery([...pending.notifications, ...delivered.notifications], false);
  return isNativeReminderHandled(itemKey);
}

export function nativeReminderDestination(extra: NativeReminderExtra): string | null {
  if (
    !isActiveOwner(extra.ownerId) ||
    !extra.url.startsWith("/") ||
    extra.url.startsWith("//") ||
    extra.url.includes("\\")
  )
    return null;
  const url = new URL(extra.url, window.location.origin);
  return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
}
/** Installed at the persistent root, also present on the signed-out screen. */
export async function initNativeReminders(): Promise<() => void> {
  if (!nativeRemindersSupported()) return () => {};
  const handles = await Promise.all([
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) changed();
    }),
    LocalNotifications.addListener("localNotificationReceived", (notification) =>
      rememberNativeDelivery([notification], false),
    ),
    LocalNotifications.addListener("localNotificationActionPerformed", async ({ notification }) => {
      const e = nativeExtra(notification);
      if (!e) return;
      const user = await getSyncUser();
      if (user?.id !== e.ownerId) return;
      const url = nativeReminderDestination(e);
      if (url) window.location.assign(url);
    }),
  ]);
  const clean = (ownerId?: string) =>
    void clearNativeReminders(ownerId).catch((error) =>
      console.error("[native-reminders] clear", error),
    );
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") clean();
    else if (event === "SIGNED_IN") clean(session?.user.id);
  });
  const initial = epoch;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (epoch === initial) clean(session?.user.id);
  return () => {
    subscription.unsubscribe();
    handles.forEach((h) => void h.remove());
  };
}
