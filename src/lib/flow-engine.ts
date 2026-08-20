// Flow-motorn – ett enda ställe som svarar på "vad är bäst att göra nu?".
//
// Motorn skapar ingen egen data. Den väger samman det som redan finns:
// dagens uppgifter (focus-rules), hur de passar just nu (daily-flow),
// din energikurva (Mitt batteri) och dagens belastning.
//
// Användaren ska aldrig behöva förstå lagren under. Ut kommer bara:
// en mening, ett nästa steg och ett val.

import type { Task } from "@/hooks/use-data";
import { focusTasksForToday } from "@/lib/focus-rules";
import { scoreTask, todayISO, type ScoredTask } from "@/lib/daily-flow";
import { itemCost, type BatteryItem, type BatteryReading } from "@/lib/energy-battery";

/* ── NU ─────────────────────────────────────────────────────────── */

export interface NowInput {
  tasks: Task[];
  /** 0–100, nivån just nu. */
  batteryNow: number;
  /** Starkaste kvarvarande fönster, t.ex. "kl 14–16". */
  peakLabel?: string | null;
  /** Minuter användaren realistiskt har. */
  availableMinutes?: number;
  /** Uppgifter användaren redan sagt "senare" om i den här sessionen. */
  skip?: string[];
  today?: string;
}

export interface NowSuggestion {
  /** Uppgiften Flow föreslår – null när det inte finns något att göra. */
  task: Task | null;
  /** En mening som förklarar läget, i vardagsspråk. */
  headline: string;
  /** Varför just den här saken. Tom när task saknas. */
  reason: string;
  /** Texten på ja-knappen. */
  ctaLabel: string;
  /** Hur många minuter det troligen tar. */
  minutes: number;
}

/** Energinivån i ord – aldrig siffror utan sammanhang. */
function energyWord(level: number): string {
  if (level >= 75) return "Du har gott om energi";
  if (level >= 55) return "Du har en hyfsad energinivå";
  if (level >= 35) return "Din energi är på halvfart";
  return "Din energi är låg just nu";
}

/**
 * Från batterinivå (0–100) till skalan daily-flow använder (1–5).
 * Håller motorn kompatibel med den befintliga poängsättningen.
 */
export function batteryToEnergyScale(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level / 20)));
}

/** Hur mycket tid som känns rimligt utifrån energin – ingen fråga behövs. */
export function defaultMinutesFor(level: number): number {
  if (level >= 70) return 60;
  if (level >= 45) return 25;
  return 10;
}

/**
 * Rankar dagens uppgifter och plockar EN. Aldrig en lista.
 */
export function rankNow(input: NowInput): ScoredTask[] {
  const today = input.today ?? todayISO();
  const skip = new Set(input.skip ?? []);
  const energy = batteryToEnergyScale(input.batteryNow);
  const availableMinutes = input.availableMinutes ?? defaultMinutesFor(input.batteryNow);
  // Låg energi = huvudet är oftast fullare. Vi härleder det i stället för att fråga.
  const load = input.batteryNow < 40 ? 4 : input.batteryNow < 65 ? 3 : 2;

  return focusTasksForToday(input.tasks, today)
    .filter((t) => !skip.has(t.id))
    .map((t) => scoreTask(t, { energy, load, availableMinutes, today }))
    .sort((a, b) => b.score - a.score);
}

export function suggestNow(input: NowInput): NowSuggestion {
  const ranked = rankNow(input);
  const level = input.batteryNow;
  const top = ranked[0];

  if (!top) {
    return {
      task: null,
      headline: `${energyWord(level)} och inget väntar på dig just nu.`,
      reason: "",
      ctaLabel: "Lägg till något",
      minutes: 0,
    };
  }

  const heavy = top.friction >= 7;
  const low = level < 40;

  let headline: string;
  if (low && heavy && input.peakLabel) {
    headline = `${energyWord(level)}. Det tyngsta passar bättre ${input.peakLabel} – men det här går att börja med.`;
  } else if (low) {
    headline = `${energyWord(level)}. Jag har valt något litet.`;
  } else if (heavy) {
    headline = `${energyWord(level)} och en sak kräver fokus. Vill du börja med den?`;
  } else {
    headline = `${energyWord(level)}. Det här är det som gör mest nytta nu.`;
  }

  // Om det ändå är den bästa saken ska förklaringen inte säga att den kan vänta.
  const available = input.availableMinutes ?? defaultMinutesFor(level);
  const reason =
    top.minutes > available
      ? "Den tar en stund, men det är den som gör mest nytta nu. Du kan börja med en liten bit."
      : top.why;

  return {
    task: top.task,
    headline,
    reason,
    ctaLabel: "Ja, börja",
    minutes: top.minutes,
  };
}

/* ── IDAG ───────────────────────────────────────────────────────── */

export type DayWeight = "lugn" | "lagom" | "tung";

export interface TodayLoad {
  weight: DayWeight;
  /** En mening om hur dagen ser ut. */
  summary: string;
  /** Antal saker som hör till idag. */
  count: number;
}

export function assessToday(reading: BatteryReading, items: BatteryItem[]): TodayLoad {
  const count = items.length;
  if (count === 0) {
    return { weight: "lugn", summary: "Dagen är öppen. Det räcker att bara vara idag. 💙", count };
  }

  const cost = items.reduce((sum, i) => sum + Math.min(0, itemCost(i)), 0);
  const gives = items.reduce((sum, i) => sum + Math.max(0, itemCost(i)), 0);

  if (reading.overloaded || cost <= -45) {
    return {
      weight: "tung",
      summary: reading.dip
        ? `Dagen kostar mer än du har kvar, särskilt ${reading.dip.label}.`
        : "Dagen kostar mer än du har kvar just nu.",
      count,
    };
  }
  if (gives >= Math.abs(cost)) {
    return { weight: "lugn", summary: "Dagen ser återhämtande ut – bra balans.", count };
  }
  return { weight: "lagom", summary: "Din dag ser ganska balanserad ut.", count };
}

export interface MoveSuggestion {
  task: Task;
  /** En mening: vad Flow föreslår och varför. */
  text: string;
}

/**
 * Max ETT flyttförslag. Vi stör bara när dagen faktiskt är tung, och
 * väljer då den sak som kostar mest men inte har en fast tid.
 */
export function suggestMove(
  load: TodayLoad,
  reading: BatteryReading,
  tasks: Task[],
  today = todayISO(),
): MoveSuggestion | null {
  if (load.weight !== "tung") return null;

  const candidates = focusTasksForToday(tasks, today)
    .filter((t) => !t.time)
    .filter((t) => !t.dueDate || t.dueDate >= today)
    .map((t) => ({
      task: t,
      cost: Math.abs(
        itemCost({
          id: t.id,
          title: t.title,
          energyImpact: t.energyImpact,
          friction: t.friction,
        }),
      ),
    }))
    .sort((a, b) => b.cost - a.cost);

  const pick = candidates[0];
  if (!pick || pick.cost <= 0) return null;

  const when = reading.dip ? `Din ${reading.dip.label} är tung` : "Din dag är tung";
  return {
    task: pick.task,
    text: `${when}. Jag föreslår att vi flyttar "${pick.task.title}" till imorgon.`,
  };
}
