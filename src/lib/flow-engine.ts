import type { Task } from "@/hooks/use-data";
import { focusTasksForToday } from "@/lib/focus-rules";
import { todayISO } from "@/lib/daily-flow";
import { itemCost, type BatteryItem, type BatteryReading } from "@/lib/energy-battery";

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
