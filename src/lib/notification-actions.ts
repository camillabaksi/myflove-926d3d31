/**
 * Snabbval direkt i notisen: "Klar" och "Skjut upp 10 min".
 *
 * Notisen (service worker eller in-app) skickar en åtgärd hit. Eftersom
 * uppgifter/påminnelser bor i klientens datalager läggs åtgärden i en liten kö
 * i localStorage som appen tömmer så fort den är öppen – även om notisen
 * klickades medan appen var stängd.
 */

export type NotificationActionType = "done" | "snooze" | "skip";

export interface QueuedNotificationAction {
  /**
   * Nyckel på formen `task:<id>`, `reminder:<id>`, `quickflow:<id>`
   * eller `med:<medId>:<datum>:<HH:MM>`.
   */
  itemKey: string;
  action: NotificationActionType;
  at: number;
}

const QUEUE_KEY = "myflove-notis-atgarder";

/** Hur många minuter "skjut upp" flyttar fram tiden. */
export const SNOOZE_MINUTES = 10;

/** Calendar notification actions identify the original recurrence date.
 * Legacy undated keys remain supported for notifications already delivered. */
export function notificationItemKeyForClientKey(clientKey: string): string {
  const match = /^rem:([^:]+)(?::(\d{4}-\d{2}-\d{2}))?(?::.*)?$/.exec(clientKey);
  return match ? `reminder:${match[1]}${match[2] ? `:${match[2]}` : ""}` : clientKey;
}

/** Notiser med de här prefixen får snabbval. */
export function supportsQuickActions(itemKey: string | undefined): boolean {
  if (!itemKey) return false;
  return /^(task|deadline|reminder|quickflow|med):/.test(itemKey);
}

export function enqueueNotificationAction(itemKey: string, action: NotificationActionType): void {
  if (typeof window === "undefined") return;
  try {
    const queue = readNotificationActions();
    queue.push({ itemKey, action, at: Date.now() });
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-20)));
  } catch {
    // ignore
  }
}

export function readNotificationActions(): QueuedNotificationAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedNotificationAction[]) : [];
  } catch {
    return [];
  }
}

export function clearNotificationActions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
}

/** Flyttar fram HH:MM ett antal minuter (klipper vid 23:59). */
export function shiftTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Läser ?notis=<key>&atgard=done ur URL:en och lägger den i kön. */
export function captureActionFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const itemKey = url.searchParams.get("notis");
  const action = url.searchParams.get("atgard");
  if (!itemKey || (action !== "done" && action !== "snooze" && action !== "skip")) return false;
  enqueueNotificationAction(itemKey, action);
  url.searchParams.delete("notis");
  url.searchParams.delete("atgard");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  return true;
}
