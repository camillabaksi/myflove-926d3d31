// Morgonstart – hjälper den som snoozar förbi alarmet att faktiskt komma igång.
// Ren logik/text, går att importera både på server och klient.

export type WakeNote = {
  title: string;
  body: string;
  requireInteraction: boolean;
  vibrate: number[];
};

/** Puffarna trappas upp mjukt: text → tydligare → kräver ett svar → första steget. */
export function getWakePush(
  name: string | null | undefined,
  stage: number,
  totalStages: number,
): WakeNote {
  const you = name || "du";
  const last = stage >= totalStages;

  if (stage <= 0) {
    return {
      title: "God morgon 🌿",
      body: `Dags att vakna, ${you}. Ingen stress – bara öppna ögonen.`,
      requireInteraction: false,
      vibrate: [60, 140, 60],
    };
  }
  if (stage === 1) {
    return {
      title: "Fortfarande morgon ☀️",
      body: "Sätt fötterna i golvet. Det räcker som start.",
      requireInteraction: false,
      vibrate: [80, 160, 80],
    };
  }
  if (stage === 2) {
    return {
      title: "Dags nu 🔔",
      body: `Tryck "Jag är vaken" så slutar jag puffa, ${you}.`,
      requireInteraction: true,
      vibrate: [90, 180, 90, 180, 90],
    };
  }
  if (last) {
    return {
      title: "Sista puffen 💜",
      body: "Jag slutar tjata nu. Ett litet steg räcker – öppna appen när du kan.",
      requireInteraction: true,
      vibrate: [80, 200, 80],
    };
  }
  return {
    title: "Bara första steget 👣",
    body: "Öppna Morgonstart och kryssa en enda sak. Resten kommer sen.",
    requireInteraction: true,
    vibrate: [90, 180, 90, 180, 90],
  };
}

export type WakeStep = { id: string; label: string };

export const DEFAULT_WAKE_STEPS: WakeStep[] = [
  { id: "up", label: "Fötterna i golvet" },
  { id: "water", label: "Ett glas vatten" },
  { id: "light", label: "Släpp upp gardinen / tänd lampan" },
];

const STEPS_KEY = "myflove-wake-steps";

export function getWakeStepsDoneToday(dateKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STEPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; done: string[] };
    return parsed.date === dateKey ? (parsed.done ?? []) : [];
  } catch {
    return [];
  }
}

export function setWakeStepsDoneToday(dateKey: string, done: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STEPS_KEY, JSON.stringify({ date: dateKey, done }));
  } catch {
    // ignore
  }
}

/** YYYY-MM-DD i svensk lokaltid. */
export function localDateKey(now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Minuter sedan midnatt i svensk lokaltid. */
export function localMinutesOfDay(now = new Date()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return Number(parts.hour ?? "0") * 60 + Number(parts.minute ?? "0");
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = (hhmm ?? "07:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
