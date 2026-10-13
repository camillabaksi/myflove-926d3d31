import { isNativeShell } from "./native-caps";
import { getDataOwner, isActiveOwner } from "./account-scope";
import { isNativeReminderHandled } from "./native-reminder-delivery";
import { isQuietNow } from "@/lib/quiet-mode";
import { buildAlarmWav, buildSilentWav } from "@/lib/alarm-sounds";
import { getAlarmFormat, getAlarmSoundId, type AlarmSoundId } from "@/lib/personalization";
export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

const ALARM_PREF_KEY = "myflow-alarm-sound-enabled";
const ALARM_EVENT = "myflow-alarm-pref-changed";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function isAlarmSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = window.localStorage.getItem(ALARM_PREF_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setAlarmSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALARM_PREF_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(ALARM_EVENT, { detail: { enabled } }));
  } catch {
    // ignore
  }
}

export function subscribeAlarmPref(cb: (enabled: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(isAlarmSoundEnabled());
  window.addEventListener(ALARM_EVENT, handler);
  const onStorage = (e: StorageEvent) => {
    if (e.key === ALARM_PREF_KEY) handler();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ALARM_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}

// ------------------------------------------------------------------
// Ljudmotor: förgenererad WAV som spelas via HTMLAudioElement.
// Detta är MYCKET mer pålitligt än Web Audio från timers, särskilt
// på mobil och när fliken är i bakgrunden.
// ------------------------------------------------------------------

let audioEl: HTMLAudioElement | null = null;
let audioUrl: string | null = null;
let audioSoundId: AlarmSoundId | null = null;
let unlockBound = false;
let unlocked = false;

/** Bygger (eller byter) ljudelementet till vald signal. */
function ensureAudio(soundId?: AlarmSoundId): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const wanted = soundId ?? getAlarmSoundId();
  if (audioEl && audioSoundId === wanted) return audioEl;
  try {
    audioEl?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(buildAlarmWav(wanted));
    audioEl = new Audio(audioUrl);
    audioEl.preload = "auto";
    audioEl.load();
    audioSoundId = wanted;
  } catch {
    audioEl = null;
    audioSoundId = null;
  }
  return audioEl;
}

/**
 * Låser upp ljudet vid första användarinteraktion. Spelar en tyst version
 * så att webbläsaren tillåter senare uppspelning från timers/notifikationer.
 */
export function initAlarmAudioUnlock(): void {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    const el = ensureAudio();
    if (!el || !audioUrl) return;
    // Upplåsningen spelar en HELT TYST ljudfil – aldrig larmsignalen.
    // På iPhone (TestFlight) ignoreras både volume = 0 och muted, så att spela
    // själva larmet "tyst" gav ett kort pip vid första trycket i appen.
    const alarmUrl = audioUrl;
    let silentUrl: string;
    try {
      silentUrl = URL.createObjectURL(buildSilentWav());
    } catch {
      return;
    }
    const restore = () => {
      try {
        el.pause();
        el.src = alarmUrl;
        el.load();
      } catch {
        // ignore
      }
      URL.revokeObjectURL(silentUrl);
    };
    el.src = silentUrl;
    el.play()
      .then(() => {
        unlocked = true;
        restore();
      })
      .catch(restore);
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock);
  window.addEventListener("click", unlock);
}

function vibrateAlarm(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate([180, 90, 180]);
  } catch {
    // ignore
  }
}

/** Har användaren stängt av larmljud (av-knapp eller format "tyst")? */
export function isAlarmMuted(): boolean {
  return getAlarmFormat() === "tyst" || getAlarmFormat() === "vibration" || !isAlarmSoundEnabled();
}

export function playAlarmSound(): void {
  const format = getAlarmFormat();
  if (format === "tyst") return;
  if (format === "vibration" || format === "bada") vibrateAlarm();
  if (format === "vibration") return;
  if (!isAlarmSoundEnabled()) return;
  const el = ensureAudio();
  if (!el) return;
  try {
    if (audioUrl && el.src !== audioUrl) el.src = audioUrl;
    el.currentTime = 0;
    el.muted = false;
    el.volume = 1;
    void el.play().catch(() => {
      // Antagligen blockerat p.g.a. saknad user gesture.
    });
  } catch {
    // ignore
  }
}

/** Kort testljud för preferens-UI (spelar även när alarm är avstängt). */
export async function playAlarmPreview(soundId?: AlarmSoundId): Promise<boolean> {
  const el = ensureAudio(soundId);
  if (!el) return false;
  try {
    if (audioUrl && el.src !== audioUrl) el.src = audioUrl;
    el.currentTime = 0;
    el.muted = false;
    el.volume = 1;
    await el.play();
    return true;
  } catch {
    return false;
  }
}

/** Returnerar om ljudet har låsts upp av en användarinteraktion. */
export function isAudioUnlocked(): boolean {
  return unlocked;
}

interface FlowNotificationOptions extends NotificationOptions {
  silentAlarm?: boolean;
  /** `task:<id>` / `reminder:<id>` / `quickflow:<id>` – ger snabbval i notisen. */
  itemKey?: string;
}

export function sendPushNotification(title: string, options?: FlowNotificationOptions): void {
  const { silentAlarm, itemKey, ...rest } = options ?? {};
  const native = isNativeShell();
  const owner = native ? getDataOwner() : null;
  const fire = () => {
    if (native && !isActiveOwner(owner)) return;
    // Tyst läge: hoppa över både ljud och notis medan påminnelser är pausade.
    if (isQuietNow()) return;
    if (itemKey && isNativeReminderHandled(itemKey)) return;
    if (!silentAlarm) {
      playAlarmSound();
    }
    if (!isNotificationSupported() || Notification.permission !== "granted") return;

    // Med service worker kan notisen få knappar ("Klart" / "Skjut upp").
    if (itemKey && "serviceWorker" in navigator) {
      void navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification(title, {
            ...rest,
            data: { url: (rest as { data?: { url?: string } }).data?.url ?? "/idag", itemKey },
            actions: [
              { action: "done", title: "\u2713 Klart" },
              { action: "snooze", title: "\u23F0 10 min" },
            ],
          } as NotificationOptions),
        )
        .catch(() => {
          try {
            new Notification(title, rest);
          } catch {
            // ignore
          }
        });
      return;
    }

    try {
      new Notification(title, rest);
    } catch {
      // ignore
    }
  };
  if (native && itemKey) {
    void import("./native-reminders")
      .then(async (m) => {
        if (!(await m.nativeForegroundHandled(itemKey))) fire();
      })
      .catch(() => fire());
  } else fire();
}
