// Tyst läge: pausar påminnelser under en viss tid, eller varje natt.
export interface QuietModeState {
  /** Tidsstämpel (ms) då pausen tar slut. 0 = ingen aktiv paus. */
  pausedUntil: number;
  /** Återkommande tyst period (t.ex. nattetid). */
  scheduleEnabled: boolean;
  /** HH:MM när tysta perioden börjar. */
  scheduleStart: string;
  /** HH:MM när tysta perioden slutar. */
  scheduleEnd: string;
  /** IANA-zon för att även servern ska använda telefonens lokala natt. */
  timeZone?: string;
}

export const QUIET_MODE_KEY = "myflove-quiet-mode";
export const QUIET_MODE_EVENT = "myflove-quiet-mode-changed";

export const QUIET_PAUSE_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 timme" },
  { minutes: 120, label: "2 timmar" },
  { minutes: 480, label: "8 timmar" },
];

export const DEFAULT_QUIET_STATE: QuietModeState = {
  pausedUntil: 0,
  scheduleEnabled: false,
  scheduleStart: "22:00",
  scheduleEnd: "07:00",
};

export function getQuietMode(): QuietModeState {
  if (typeof window === "undefined") return DEFAULT_QUIET_STATE;
  try {
    const raw = window.localStorage.getItem(QUIET_MODE_KEY);
    if (!raw) return DEFAULT_QUIET_STATE;
    return { ...DEFAULT_QUIET_STATE, ...(JSON.parse(raw) as Partial<QuietModeState>) };
  } catch {
    return DEFAULT_QUIET_STATE;
  }
}

export function setQuietMode(patch: Partial<QuietModeState>): QuietModeState {
  const next = {
    ...getQuietMode(),
    ...patch,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(QUIET_MODE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(QUIET_MODE_EVENT, { detail: next }));
    } catch {
      // ignore
    }
  }
  return next;
}

/** Pausar alla påminnelser i angivet antal minuter. */
export function pauseRemindersFor(minutes: number): QuietModeState {
  return setQuietMode({ pausedUntil: Date.now() + minutes * 60 * 1000 });
}

/** Avbryter en pågående paus. */
export function resumeReminders(): QuietModeState {
  return setQuietMode({ pausedUntil: 0 });
}

function minutesOfDay(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

export function isWithinSchedule(state: QuietModeState, now = new Date()): boolean {
  if (!state.scheduleEnabled) return false;
  const start = minutesOfDay(state.scheduleStart);
  const end = minutesOfDay(state.scheduleEnd);
  if (start === null || end === null || start === end) return false;
  let current = now.getHours() * 60 + now.getMinutes();
  if (state.timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: state.timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now);
      current =
        Number(parts.find((p) => p.type === "hour")?.value) * 60 +
        Number(parts.find((p) => p.type === "minute")?.value);
    } catch {
      // Äldre/ogiltig zon: använd miljöns lokala tid tills klienten uppdaterar den.
    }
  }
  // Perioden kan gå över midnatt (t.ex. 22:00–07:00).
  return start < end ? current >= start && current < end : current >= start || current < end;
}

/** True om påminnelser ska vara tysta just nu. */
export function isQuietNow(state: QuietModeState = getQuietMode(), now = new Date()): boolean {
  if (state.pausedUntil > now.getTime()) return true;
  return isWithinSchedule(state, now);
}

export function subscribeQuietMode(cb: (state: QuietModeState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(getQuietMode());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === QUIET_MODE_KEY) handler();
  };
  const localHandler = (e: Event) => {
    if ((e as CustomEvent<{ key?: string }>).detail?.key === QUIET_MODE_KEY) handler();
  };
  window.addEventListener(QUIET_MODE_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  window.addEventListener("myflow-local-storage", localHandler);
  return () => {
    window.removeEventListener(QUIET_MODE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener("myflow-local-storage", localHandler);
  };
}
