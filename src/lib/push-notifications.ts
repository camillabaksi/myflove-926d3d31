export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const ALARM_PREF_KEY = 'myflow-alarm-sound-enabled';
const ALARM_EVENT = 'myflow-alarm-pref-changed';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

export function isAlarmSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = window.localStorage.getItem(ALARM_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setAlarmSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ALARM_PREF_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(ALARM_EVENT, { detail: { enabled } }));
  } catch {
    // ignore
  }
}

export function subscribeAlarmPref(cb: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb(isAlarmSoundEnabled());
  window.addEventListener(ALARM_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === ALARM_PREF_KEY) handler();
  });
  return () => window.removeEventListener(ALARM_EVENT, handler);
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
}

/**
 * Spelar en mjuk, varm alarmsignal (tre pip) via Web Audio API.
 * Ingen extern ljudfil behövs.
 */
export function playAlarmSound(): void {
  if (!isAlarmSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Vissa webbläsare kräver att kontexten återupptas efter user gesture.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const beeps = [
    { start: 0, freq: 880 },
    { start: 0.35, freq: 1046 },
    { start: 0.7, freq: 880 },
  ];

  for (const beep of beeps) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = beep.freq;
    gain.gain.setValueAtTime(0.0001, now + beep.start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + beep.start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + beep.start + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + beep.start);
    osc.stop(now + beep.start + 0.3);
  }
}

/** Kort testljud för preferens-UI, spelar även om alarmet är avstängt. */
export function playAlarmPreview(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

interface FlowNotificationOptions extends NotificationOptions {
  /** Sätt true för att hoppa över alarmljudet, även om det är på. */
  silentAlarm?: boolean;
}

export function sendPushNotification(title: string, options?: FlowNotificationOptions): void {
  const { silentAlarm, ...rest } = options ?? {};
  if (!silentAlarm) {
    playAlarmSound();
  }
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, rest);
  } catch {
    // Ignore notification errors (e.g. unsupported in this browsing context)
  }
}
