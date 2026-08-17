// Omplanering – när FlowScore är lågt ska dagen kunna göras mindre,
// inte personen sämre. Här bor lägena och hur de påverkar vad som får
// plats idag och vad som hamnar under "Resten kan vänta".

import type { FlowScore } from "@/lib/flowscore";
import type { FlowItem } from "@/lib/flow-items";

export type ReplanMode = "vanlig" | "lattare" | "minsta";

export interface ReplanOption {
  mode: ReplanMode;
  emoji: string;
  label: string;
  /** Vad läget innebär, i vardagsspråk. */
  blurb: string;
}

export const REPLAN_OPTIONS: ReplanOption[] = [
  {
    mode: "vanlig",
    emoji: "🗓️",
    label: "Behåll planen",
    blurb: "Dagen ser ut som vanligt. Du kan ändra dig när som helst.",
  },
  {
    mode: "lattare",
    emoji: "🌤️",
    label: "Gör dagen lättare",
    blurb: "Färre saker och bara det som inte känns tungt. Resten ligger kvar.",
  },
  {
    mode: "minsta",
    emoji: "🛟",
    label: "Bara det nödvändigaste",
    blurb: "Hållpunkter och en enda sak. Allt annat får vänta till imorgon.",
  },
];

export function replanOption(mode: ReplanMode): ReplanOption {
  return REPLAN_OPTIONS.find((o) => o.mode === mode) ?? REPLAN_OPTIONS[0]!;
}

/** Kapacitetsregler per läge – utgår alltid från dagens FlowScore. */
export function capacityForMode(
  flow: Pick<FlowScore, "suggestedTasks" | "maxFriction" | "score">,
  mode: ReplanMode,
): { suggestedTasks: number; maxEnergy: number } {
  const base = Math.max(1, flow.suggestedTasks || 3);
  if (mode === "minsta") return { suggestedTasks: 1, maxEnergy: 4 };
  if (mode === "lattare") {
    return {
      suggestedTasks: Math.max(1, Math.ceil(base / 2)),
      maxEnergy: Math.min(flow.maxFriction, 5),
    };
  }
  return { suggestedTasks: base, maxEnergy: flow.score < 45 ? 6 : 10 };
}

/** Läget MyFlove själv skulle välja utifrån hur dagen ser ut. */
export function suggestedMode(score: number): ReplanMode {
  if (score < 30) return "minsta";
  if (score < 50) return "lattare";
  return "vanlig";
}

/** Ska vi ens fråga? Vi stör bara när kapaciteten faktiskt är låg. */
export function shouldOfferReplan(score: number): boolean {
  return score < 50;
}

/**
 * Kort, konkret text om vad omplaneringen gör – bygger på det som faktiskt
 * ligger i dagen, inte på generella råd.
 */
export function replanReason(flow: Pick<FlowScore, "score" | "load">, items: FlowItem[]): string {
  const heavy = items.filter((i) => (i.energy ?? 0) >= 7).length;
  const overdue = items.filter((i) => typeof i.daysUntil === "number" && i.daysUntil < 0).length;
  const fixed = items.filter((i) => i.time).length;

  const parts: string[] = [];
  if (overdue > 0)
    parts.push(`${overdue} sak${overdue === 1 ? "" : "er"} har passerat sitt datum`);
  if (heavy > 0) parts.push(`${heavy} känns tung${heavy === 1 ? "" : "a"} just nu`);
  if (fixed > 0) parts.push(`${fixed} hållpunkt${fixed === 1 ? "" : "er"} är redan bokade`);

  const why = parts.length ? `${parts.join(", ")}.` : "Dagen är full nog som den är.";
  return `Din kapacitet är ${flow.load}. ${why} Vi kan göra dagen mindre i stället för att du ska göra mer.`;
}

/** Vad valet betyder i praktiken – visas efter att man valt. */
export function replanEffect(mode: ReplanMode, keep: number, rest: number): string {
  if (mode === "vanlig") return `${keep} saker i dagens plan.`;
  const moved = rest === 1 ? "1 sak" : `${rest} saker`;
  return `${keep} sak${keep === 1 ? "" : "er"} kvar idag – ${moved} ligger under "Resten kan vänta".`;
}
