// Dagens ramar – när morgonen startar och när dagen slutar.
// Ren logik: används av Mitt batteri™ för att veta hur lång dagen är
// och hur den började respektive slutade.

export interface DayWindow {
  /** HH:MM – när morgonen startar. */
  start: string;
  /** HH:MM – när dagen slutar. */
  end: string;
}

/** 1–10-värden per datum (YYYY-MM-DD). */
export interface DayEdgeEntry {
  morning?: number;
  /** Tid för den egna morgonregistreringen; äldre poster saknar detta. */
  morningLoggedAt?: string;
  evening?: number;
}

export type DayEdges = Record<string, DayEdgeEntry>;

export const DEFAULT_DAY_WINDOW: DayWindow = { start: "07:00", end: "22:00" };

export function parseHHMM(t: string, fallback = 0): number {
  if (!/^\d{1,2}:\d{2}$/.test(t ?? "")) return fallback;
  const [h, m] = t.split(":").map(Number);
  return Math.min(24 * 60, Math.max(0, h * 60 + m));
}

/** Klampar och ordnar fönstret så att slutet alltid ligger efter starten. */
export function normalizeWindow(win: DayWindow): { startMinutes: number; endMinutes: number } {
  const start = parseHHMM(win?.start ?? DEFAULT_DAY_WINDOW.start, 7 * 60);
  const rawEnd = parseHHMM(win?.end ?? DEFAULT_DAY_WINDOW.end, 22 * 60);
  const end = Math.max(start + 120, rawEnd);
  return { startMinutes: start, endMinutes: Math.min(24 * 60, end) };
}

/** 1–10 → 0–100. */
export const edgeToPercent = (v: number) => Math.min(100, Math.max(0, ((v - 1) / 9) * 100));

export const dayKey = (now = new Date()) => {
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};
