// Att göra™ – MyFloves centrala dagliga agenda.
//
// Här bor bara ren logik: hur en uppgift beskrivs energimässigt, hur dagen
// delas upp i Idag / Kommande / Klart, och hur "när?"-snabbvalen översätts
// till datum och tid. Uppgifterna själva ligger kvar i useTasks – vi skapar
// aldrig ett parallellt system.

import type { Task } from "@/hooks/use-data";

/** Hur en uppgift påverkar energin – förväntad eller faktisk. */
export type EnergyImpact = "drains" | "gives" | "both" | "neutral" | "unknown";

/** Friktion/storlek – hur tungt det känns att komma igång. */
export type TaskFriction = "small" | "medium" | "large";

export const ENERGY_IMPACT_META: Record<
  EnergyImpact,
  { emoji: string; label: string; doneLabel: string }
> = {
  drains: { emoji: "⚡", label: "Tar energi", doneLabel: "Tog energi" },
  gives: { emoji: "❤️", label: "Ger energi", doneLabel: "Gav energi" },
  both: { emoji: "↔️", label: "Både och", doneLabel: "Både och" },
  neutral: { emoji: "➖", label: "Ingen skillnad", doneLabel: "Ingen skillnad" },
  unknown: { emoji: "🤷", label: "Vet inte", doneLabel: "Vet inte" },
};

export const ENERGY_IMPACTS: EnergyImpact[] = ["drains", "gives", "both", "unknown"];

export const FRICTION_META: Record<
  TaskFriction,
  { emoji: string; label: string; minutes: number }
> = {
  small: { emoji: "🟢", label: "Litet", minutes: 10 },
  medium: { emoji: "🟡", label: "Mellan", minutes: 30 },
  large: { emoji: "◯", label: "Stort", minutes: 60 },
};

export const FRICTIONS: TaskFriction[] = ["small", "medium", "large"];

/** Snabbvalen under "När?" i plustknappen. */
export type WhenChoice = "nu" | "senare-idag" | "valj" | "ingen";

export const WHEN_CHOICES: { id: WhenChoice; emoji: string; label: string }[] = [
  { id: "nu", emoji: "⏱️", label: "Nu" },
  { id: "senare-idag", emoji: "🌤️", label: "Senare idag" },
  { id: "valj", emoji: "📅", label: "Välj datum/tid" },
  { id: "ingen", emoji: "🫧", label: "Ingen tid" },
];

export function todayISO(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Klockslaget nu, avrundat uppåt till närmaste kvart. */
export function nowTime(now = new Date()): string {
  const d = new Date(now);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Senare idag" = om två timmar, men aldrig efter 21:00. */
export function laterTodayTime(now = new Date()): string {
  const d = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  if (d.getHours() >= 21) return "21:00";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Översätter ett snabbval till datum + tid. Tomt = ingen tid, bara idag. */
export function resolveWhen(
  choice: WhenChoice,
  custom: { date?: string; time?: string },
  now = new Date(),
): { dueDate?: string; time?: string } {
  switch (choice) {
    case "nu":
      return { dueDate: todayISO(now), time: nowTime(now) };
    case "senare-idag":
      return { dueDate: todayISO(now), time: laterTodayTime(now) };
    case "valj":
      return { dueDate: custom.date || todayISO(now), time: custom.time || undefined };
    case "ingen":
    default:
      return { dueDate: undefined, time: undefined };
  }
}

export interface AgendaGroups {
  /** Med klockslag idag – sorterat på tid. */
  timed: Task[];
  /** Idag men utan klockslag. */
  untimed: Task[];
  /** Framåt i tiden. */
  upcoming: Task[];
  /** Passerat datum och fortfarande öppet. */
  overdue: Task[];
}

/**
 * Delar upp aktiva uppgifter i dagens agenda. Uppgifter utan datum räknas
 * som "idag utan tid" – de ska aldrig försvinna ur användarens blick.
 */
export function groupAgenda(tasks: Task[], now = new Date()): AgendaGroups {
  const today = todayISO(now);
  const timed: Task[] = [];
  const untimed: Task[] = [];
  const upcoming: Task[] = [];
  const overdue: Task[] = [];

  for (const t of tasks) {
    const due = t.dueDate;
    if (due && due > today) {
      upcoming.push(t);
      continue;
    }
    if (due && due < today) {
      overdue.push(t);
      continue;
    }
    if (t.time) timed.push(t);
    else untimed.push(t);
  }

  timed.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  upcoming.sort(
    (a, b) =>
      (a.dueDate ?? "").localeCompare(b.dueDate ?? "") ||
      (a.time ?? "").localeCompare(b.time ?? ""),
  );
  overdue.sort((a, b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""));

  return { timed, untimed, upcoming, overdue };
}

/** "Idag", "Imorgon", "onsdag 3 sep" – samma språk överallt. */
export function describeDay(due: string | undefined, now = new Date()): string {
  if (!due) return "Ingen dag";
  const today = todayISO(now);
  if (due === today) return "Idag";
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  if (due === todayISO(t)) return "Imorgon";
  const d = new Date(`${due}T00:00:00`);
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
}

/**
 * Ett mjukt förslag från Flow när dagens tyngd inte riktigt möter kapaciteten.
 * Det är alltid ett förslag – användaren kan alltid göra ändå.
 */
export function agendaSuggestion(opts: {
  flowScore: number;
  heavyCount: number;
  totalToday: number;
}): { headline: string; body: string } | null {
  const { flowScore, heavyCount, totalToday } = opts;
  if (totalToday === 0) return null;
  if (flowScore < 40 && heavyCount > 0) {
    return {
      headline: "Din energi är låg idag.",
      body:
        heavyCount === 1
          ? "Du har en sak som brukar ta mycket. Vill du dela upp den i mindre steg – eller köra ändå?"
          : `Du har ${heavyCount} saker som brukar ta mycket energi. Vi kan börja med det minsta och dela upp resten.`,
    };
  }
  if (flowScore < 60 && totalToday > 5) {
    return {
      headline: "Det är ganska mycket på idag.",
      body: "Vill du att jag föreslår en ordning, eller flyttar något till imorgon? Du bestämmer.",
    };
  }
  if (flowScore >= 75 && heavyCount > 0) {
    return {
      headline: "Din energi ser bra ut just nu.",
      body: "Om du vill kan det vara ett bra läge att ta det som brukar kännas tyngst.",
    };
  }
  return null;
}
