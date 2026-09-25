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

