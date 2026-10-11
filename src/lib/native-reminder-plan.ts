import type { LocalNotificationSchema, Channel } from "@capacitor/local-notifications";
import type { AlarmFormat, AlarmSoundId } from "./personalization";
import { isQuietNow, type QuietModeState } from "./quiet-mode";
import { nativeSoundFile, NATIVE_SILENT_FILE } from "./native-sound-assets";

export interface DeviceReminder {
  clientKey: string;
  title: string;
  body: string;
  deliverAt: string;
  url: string;
}
export interface NativeReminderPreferences {
  quiet: QuietModeState;
  sound: AlarmSoundId;
  format: AlarmFormat;
  soundEnabled: boolean;
}
export interface NativeReminderExtra {
  paceable: true;
  ownerId: string;
  clientKey: string;
  itemKey: string;
  scheduledAt: string;
  deliverAt: string;
  fingerprint: string;
  url: string;
  sourceKey?: string;
  transient?: true;
}
export const NATIVE_PENDING_LIMIT = 60;

export function reminderItemKey(key: string): string {
  return key.startsWith("rem:") ? `reminder:${key.split(":")[1]}` : key;
}
export function nativeExtra(notification: { extra?: unknown }): NativeReminderExtra | null {
  const e = notification.extra as Partial<NativeReminderExtra> | undefined;
  return e?.paceable === true &&
    typeof e.ownerId === "string" &&
    typeof e.clientKey === "string" &&
    typeof e.scheduledAt === "string" &&
    typeof e.deliverAt === "string" &&
    typeof e.itemKey === "string" &&
    typeof e.url === "string" &&
    typeof e.fingerprint === "string" &&
    (e.sourceKey === undefined || typeof e.sourceKey === "string")
    ? (e as NativeReminderExtra)
    : null;
}
export function nativeAlarmChannel(prefs: NativeReminderPreferences): Channel {
  const audible = prefs.soundEnabled && (prefs.format === "ljud" || prefs.format === "bada");
  const vibration = prefs.format === "vibration" || prefs.format === "bada";
  return {
    id: `paceable-v1-${audible ? prefs.sound : "silent"}-${vibration ? "vibrate" : "still"}`,
    name: "Paceable-påminnelser",
    description: "Påminnelser med ditt valda ljud och vibrationsläge.",
    importance: 4,
    visibility: 0,
    ...(audible ? { sound: nativeSoundFile(prefs.sound) } : {}),
    vibration,
  };
}
/** Defer, rather than lose, reminders inside a pause/night. IANA time handles DST. */
export function nativeDeliveryTime(deliverAt: number, quiet: QuietModeState): number {
  let at = Math.max(deliverAt, Number.isFinite(quiet.pausedUntil) ? quiet.pausedUntil : 0);
  for (let minutes = 0; minutes < 26 * 60 && isQuietNow(quiet, new Date(at)); minutes++) {
    at = Math.floor(at / 60_000) * 60_000 + 60_000;
  }
  return at;
}
function reminderId(owner: string, key: string): number {
  let hash = 2166136261;
  for (const char of `${owner}:${key}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 2147483600) + 1;
}
export function buildNativeReminderPlan(
  ownerId: string,
  reminders: readonly DeviceReminder[],
  prefs: NativeReminderPreferences,
  now = Date.now(),
  pending: readonly { id: number; extra?: unknown }[] = [],
): LocalNotificationSchema[] {
  const channel = nativeAlarmChannel(prefs);
  const occupied = new Set<number>();
  const existing = new Map<string, number>();
  let otherCount = 0;
  for (const p of pending) {
    const e = nativeExtra(p);
    if (e?.ownerId === ownerId) existing.set(e.clientKey, p.id);
    else {
      occupied.add(p.id);
      otherCount++;
    }
  }
  const budget = Math.max(0, NATIVE_PENDING_LIMIT - otherCount);
  const next = reminders
    .map((r) => {
      const original = Date.parse(r.deliverAt);
      let at = nativeDeliveryTime(original, prefs.quiet);
      const previous = pending.find((p) => {
        const e = nativeExtra(p);
        return e?.ownerId === ownerId && e.clientKey === r.clientKey && e.deliverAt === r.deliverAt;
      });
      // Releasing a pause must not discard a deferred reminder already accepted by the OS.
      if (at <= now && previous && Date.parse(nativeExtra(previous)!.scheduledAt) > original) {
        const acceptedAt = Date.parse(nativeExtra(previous)!.scheduledAt);
        at = acceptedAt > now && acceptedAt <= now + 2_000 ? acceptedAt : now + 1_000;
      }
      return { r, at };
    })
    // Past occurrences are not replayed on opening. A quiet deferred occurrence stays future.
    .filter(
      ({ r, at }) =>
        Number.isFinite(at) &&
        at > now &&
        (Date.parse(r.deliverAt) > now ||
          pending.some((p) => {
            const e = nativeExtra(p);
            return (
              e?.ownerId === ownerId && e.clientKey === r.clientKey && e.deliverAt === r.deliverAt
            );
          })),
    )
    .sort((a, b) => a.at - b.at || a.r.clientKey.localeCompare(b.r.clientKey))
    .slice(0, budget);
  // Retain pending IDs even when a newly added earlier reminder changes ordering.
  for (const { r } of next) {
    const id = existing.get(r.clientKey);
    if (id) occupied.add(id);
  }
  return next.map(({ r, at }) => {
    let id = existing.get(r.clientKey) ?? reminderId(ownerId, r.clientKey);
    if (!existing.has(r.clientKey)) {
      while (occupied.has(id)) id = id >= 2147483600 ? 1 : id + 1;
    }
    occupied.add(id);
    const scheduledAt = new Date(at).toISOString();
    const fingerprint = JSON.stringify([r.title, r.body, scheduledAt, r.url, channel.id]);
    const extra: NativeReminderExtra = {
      paceable: true,
      ownerId,
      clientKey: r.clientKey,
      itemKey: reminderItemKey(r.clientKey),
      scheduledAt,
      deliverAt: r.deliverAt,
      fingerprint,
      url: r.url,
    };
    return {
      id,
      title: r.title,
      body: r.body,
      extra,
      schedule: { at: new Date(at), allowWhileIdle: true },
      channelId: channel.id,
      // Silent WAV also prevents Android 7 from substituting the system default sound.
      sound: channel.sound ?? NATIVE_SILENT_FILE,
      smallIcon: "ic_stat_paceable",
      foreground: true,
      isExactNotification: true,
      isExactMandatory: true,
    };
  });
}
