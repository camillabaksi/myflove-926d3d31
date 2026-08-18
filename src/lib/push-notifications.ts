import { isQuietNow } from "@/lib/quiet-mode";
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
  window.addEventListener("storage", (e) => {
    if (e.key === ALARM_PREF_KEY) handler();
  });
  return () => window.removeEventListener(ALARM_EVENT, handler);
}

// ------------------------------------------------------------------
// Ljudmotor: förgenererad WAV som spelas via HTMLAudioElement.
// Detta är MYCKET mer pålitligt än Web Audio från timers, särskilt
// på mobil och när fliken är i bakgrunden.
// ------------------------------------------------------------------

let audioEl: HTMLAudioElement | null = null;
let audioUrl: string | null = null;
let unlockBound = false;
let unlocked = false;

/** Bygger en WAV-blob med tre mjuka pip (880 / 1046 / 880 Hz). */
function buildAlarmWav(): Blob {
  const sampleRate = 44100;
  const beeps = [
    { start: 0.0, freq: 880, dur: 0.28 },
    { start: 0.35, freq: 1046, dur: 0.28 },
    { start: 0.7, freq: 880, dur: 0.32 },
  ];
  const totalSeconds = 1.1;
  const totalSamples = Math.floor(sampleRate * totalSeconds);
  const samples = new Float32Array(totalSamples);

  for (const beep of beeps) {
    const startSample = Math.floor(beep.start * sampleRate);
    const durSamples = Math.floor(beep.dur * sampleRate);
    const attack = Math.floor(0.02 * sampleRate);
    const release = Math.floor(0.08 * sampleRate);
    for (let i = 0; i < durSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      let env = 1;
      if (i < attack) env = i / attack;
      else if (i > durSamples - release) env = Math.max(0, (durSamples - i) / release);
      const t = i / sampleRate;
      samples[idx] += Math.sin(2 * Math.PI * beep.freq * t) * env * 0.35;
    }
  }

  // Encode as 16-bit PCM WAV
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioEl) {
    try {
      audioUrl = URL.createObjectURL(buildAlarmWav());
      audioEl = new Audio(audioUrl);
      audioEl.preload = "auto";
      audioEl.load();
    } catch {
      audioEl = null;
    }
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
    if (!el) return;
    const prevVol = el.volume;
    el.volume = 0;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.volume = prevVol;
        unlocked = true;
      })
      .catch(() => {
        el.volume = prevVol;
      });
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

export function playAlarmSound(): void {
  if (!isAlarmSoundEnabled()) return;
  const el = ensureAudio();
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = 1;
    void el.play().catch(() => {
      // Antagligen blockerat p.g.a. saknad user gesture.
    });
  } catch {
    // ignore
  }
}

/** Kort testljud för preferens-UI (spelar även när alarm är avstängt). */
export function playAlarmPreview(): void {
  const el = ensureAudio();
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = 1;
    void el.play().catch(() => {});
  } catch {
    // ignore
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
  // Tyst läge: hoppa över både ljud och notis medan påminnelser är pausade.
  if (isQuietNow()) return;
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
          data: { url: (rest as { data?: { url?: string } }).data?.url ?? "/hem", itemKey },
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
}
