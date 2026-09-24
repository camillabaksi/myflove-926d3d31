// Flow-objekt – MyFloves gemensamma språk för "en sak i livet".
//
// Modellen: Liv → Behov → Energi → Prioritering → Handling → Reflektion.
// Allt som användaren skapar – en uppgift, en lektion, en kalenderhändelse,
// barnens hållpunkt, en rutin eller en tanke i Quickflow – kan beskrivas med
// samma fem saker: livsområde, när, prioritet, energibehov och nästa steg.
//
// Den här filen innehåller bara ren logik. Hooken som samlar in data ligger i
// src/hooks/use-flow-items.ts, och kortet som visar dem i
// src/components/myflove/flow-item-card.tsx.

import { AREA_META, type LifeArea } from "@/lib/life-areas";

export type FlowItemSource =
  | "uppgift"
  | "kalender"
  | "lektion"
  | "barn"
  | "rutin"
  | "tanke"
  | "quickflow"
  | "gjort";

export type FlowPriority = "nu" | "idag" | "snart" | "senare";

export interface FlowItem {
  id: string;
  title: string;
  source: FlowItemSource;
  /** Livsområde – samma fyra rum överallt i appen. */
  area: LifeArea;
  emoji: string;
  /** HH:MM när saken har en fast tid idag. */
  time?: string;
  /** ISO-datum (YYYY-MM-DD) för deadline. */
  dueDate?: string;
  /** Dagar kvar till deadline. Negativt = passerad. */
  daysUntil?: number;
  priority: FlowPriority;
  /** Energibehov 1–10, från friktionsbiblioteket när det matchar. */
  energy?: number;
  /** Varför energibehovet ser ut som det gör. */
  energyReason?: string;
  /** Nästa lilla steg – aldrig hela berget. */
  nextStep?: string;
  /** Gemensamt ID när posten kommer från QuickFlow. */
  quickflowId?: string;
  /** Facket som styr den synliga prioriteringsfärgen. */
  quickflowBucket?: "nu" | "sedan" | "om-du-orkar" | "kan-vanta";
  done?: boolean;
  /** Användarens egen ordning (QuickFlow) – lägre nummer först. */
  order?: number;
  /**
   * Kan användaren rimligen säga "det där har jag gjort"? Då ska det gå att
   * bocka av – oavsett om det tekniskt är en uppgift, händelse eller rutin.
   * Rena informationsposter lämnas som false.
   */
  completable?: boolean;
  /** Vart användaren kan gå för att jobba med saken. */
  href?: string;
  /** Diskret koppling till en familjemedlems aktivitet, t.ex. "Bella – Förskola". */
  linkedLabel?: string;
}

export const SOURCE_LABEL: Record<FlowItemSource, string> = {
  uppgift: "Att göra",
  kalender: "Kalender",
  lektion: "Lektion",
  barn: "Barnen",
  rutin: "Rutin",
  tanke: "Tanke",
  quickflow: "QuickFlow",
  gjort: "Gjort",
};

export const PRIORITY_LABEL: Record<FlowPriority, string> = {
  nu: "Nu",
  idag: "Idag",
  snart: "Snart",
  senare: "Senare",
};

export function todayISO(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function daysUntilDate(due: string, now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(`${due}T00:00:00`).getTime() - start) / 86_400_000);
}

/**
 * Vilken dag hör en AVKLARAD sak till?
 *
 * Regeln: har saken ett planerat datum (kalenderpost, uppgift med datum) styr
 * ALLTID det datumet var den visas – även efter att den bockats av. Bara saker
 * helt utan datum (fria tankar, inbox-uppgifter) hör till dagen de gjordes.
 * Det gör att "APT på förskolan 2026-08-25" ligger kvar den 25 augusti i stället
 * för att hoppa in i Min dag den dag man kryssade i den.
 */
export function completedBelongsToDay(
  day: string,
  scheduledDate?: string,
  completedAt?: number,
): boolean {
  if (scheduledDate) return scheduledDate === day;
  if (!completedAt) return false;
  const d = new Date(completedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` === day;
}

/** Prioritet utifrån tid och deadline – inte utifrån hur duktig man är. */
export function priorityFor(opts: {
  time?: string;
  daysUntil?: number;
  fixed?: boolean;
}): FlowPriority {
  const d = opts.daysUntil;
  if (typeof d === "number") {
    // Ett datum längre fram hör aldrig till idag – oavsett klockslag.
    if (d < 0) return "nu";
    if (d === 0) return opts.fixed && opts.time ? "idag" : "idag";
    if (d <= 7) return "snart";
    return "senare";
  }
  if (opts.time) return "idag";
  return "senare";
}

/** "Idag 14:00", "Om 3 dagar", "2 dagar sen" – samma formulering överallt. */
export function describeWhen(item: FlowItem): string | null {
  if (typeof item.daysUntil === "number") {
    const d = item.daysUntil;
    const day =
      d < 0
        ? `${Math.abs(d)} dag${Math.abs(d) === 1 ? "" : "ar"} sen`
        : d === 0
          ? "Idag"
          : d === 1
            ? "Imorgon"
            : `Om ${d} dagar`;
    return item.time ? `${day} ${item.time}` : day;
  }
  if (item.time) return `Idag ${item.time}`;
  return null;
}

/** Kort beskrivning av energibehovet – i ord, inte som betyg. */
export function describeEnergy(energy?: number): string | null {
  if (typeof energy !== "number") return null;
  if (energy >= 7) return "Känns tungt";
  if (energy >= 5) return "Mellanting";
  return "Ganska lätt";
}

const PRIORITY_RANK: Record<FlowPriority, number> = { nu: 0, idag: 1, snart: 2, senare: 3 };

/** Sorterar så att det mest tidsnära kommer först, sedan klockslag. */
export function sortFlowItems(items: FlowItem[]): FlowItem[] {
  return [...items].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    if (typeof a.order === "number" && typeof b.order === "number" && a.order !== b.order)
      return a.order - b.order;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return (a.daysUntil ?? 99) - (b.daysUntil ?? 99);
  });
}

/**
 * Vad som är rimligt att visa när kapaciteten är låg: fasta hållpunkter
 * ligger kvar (de går inte att önska bort), och av det valbara plockas
 * det lättaste och mest tidsnära.
 */
export function withinCapacity(
  items: FlowItem[],
  opts: { suggestedTasks: number; maxEnergy?: number },
): { keep: FlowItem[]; rest: FlowItem[] } {
  const sorted = sortFlowItems(items);
  const keep: FlowItem[] = [];
  const rest: FlowItem[] = [];
  let chosen = 0;

  for (const item of sorted) {
    const fixed = item.source === "lektion" || item.source === "barn" || !!item.time;
    if (fixed) {
      keep.push(item);
      continue;
    }
    const tooHeavy =
      typeof opts.maxEnergy === "number" &&
      typeof item.energy === "number" &&
      item.energy > opts.maxEnergy &&
      item.priority !== "nu";
    if (!tooHeavy && chosen < opts.suggestedTasks) {
      keep.push(item);
      chosen += 1;
    } else {
      rest.push(item);
    }
  }

  return { keep, rest };
}

export function areaLabel(area: LifeArea): string {
  return `${AREA_META[area].emoji} ${AREA_META[area].label}`;
}
