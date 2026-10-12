// Mitt batteri™ – din personliga energikurva över dagen.
//
// Här bor bara ren logik. Batteriet skapar aldrig egen data: nivån nu kommer
// från FlowScore, formen på dagen från ditt eget energimönster (Energikartan),
// och rörelsen framåt från dagens aktiviteters energipåverkan.

import type { EnergyPattern } from "./energy-pattern";
import type { EnergyImpact, TaskFriction } from "./task-agenda";

export const BATTERY_START_HOUR = 6;
export const BATTERY_END_HOUR = 23;
/** Ett steg = 30 minuter. */
export const SLOT_MINUTES = 30;

export interface BatterySlot {
  /** Minuter från midnatt. */
  minutes: number;
  /** HH:MM */
  time: string;
  /** 0–100. */
  level: number;
  /** Sant för tider som redan passerat. */
  past: boolean;
}

/** En sak på dagen som kan påverka energin. */
export interface BatteryItem {
  id: string;
  title: string;
  /** HH:MM, tomt = ingen tid (påverkar inte kurvan). */
  time?: string;
  endTime?: string;
  energyImpact?: EnergyImpact;
  friction?: TaskFriction;
}

export interface BatteryWindow {
  startMinutes: number;
  endMinutes: number;
  label: string;
  level: number;
}

export type BatteryTrend = "stiger" | "jamn" | "sjunker";

export interface BatteryReading {
  slots: BatterySlot[];
  /** Nivån just nu, 0–100. */
  now: number;
  trend: BatteryTrend;
  trendLabel: string;
  /** Starkaste fönstret som är kvar av dagen. */
  peak: BatteryWindow | null;
  /** Svagaste fönstret som är kvar av dagen. */
  dip: BatteryWindow | null;
  /** Sant när kurvan bygger på ditt eget mönster, inte en generisk kurva. */
  personal: boolean;
  /** Hur mycket dagen kostar framåt jämfört med vad du har kvar. */
  overloaded: boolean;
  /** En kort mening att visa direkt på kortet. */
  summary: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function minutesToTime(m: number): string {
  return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
}

export function timeToMinutes(t: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Mjuk generisk dygnskurva – används bara tills dina egna loggar räcker. */
function genericLevel(hour: number): number {
  const curve: Record<number, number> = {
    6: 42,
    7: 52,
    8: 62,
    9: 72,
    10: 76,
    11: 72,
    12: 62,
    13: 52,
    14: 48,
    15: 54,
    16: 58,
    17: 55,
    18: 50,
    19: 44,
    20: 36,
    21: 28,
    22: 22,
    23: 18,
  };
  return curve[hour] ?? 30;
}

/** 1–5 → 0–100. */
const levelToPercent = (v: number) => ((v - 1) / 4) * 100;

const clamp = (n: number, lo = 3, hi = 100) => Math.min(hi, Math.max(lo, n));

/** Hur mycket en sak drar eller ger, i procentenheter. */
export function itemCost(item: BatteryItem): number {
  // Startmotstånd säger inget om den faktiska energikostnaden.
  const size = 9;
  switch (item.energyImpact) {
    case "gives":
      return size * 0.8;
    case "both":
    case "neutral":
      return 0;
    case "drains":
      return -size;
    default:
      // Okänd påverkan är inte en registrerad energiförlust.
      return 0;
  }
}

export interface BatteryInput {
  pattern: EnergyPattern;
  /** FlowScore just nu, 0–100. */
  flowNow: number;
  items: BatteryItem[];
  /** Dagens viktade netto från Energiflöde™ (kan vara negativt). */
  energyFlowNet?: number;
  /** När morgonen startar (minuter från midnatt). */
  dayStartMinutes?: number;
  /** När dagen slutar (minuter från midnatt). */
  dayEndMinutes?: number;
  /** Egen ifyllnad vid morgonens start (0–100). */
  morningLevel?: number | null;
  /** Egen ifyllnad vid dagens slut (0–100). */
  eveningLevel?: number | null;
  now?: Date;
}

export function buildBattery(input: BatteryInput): BatteryReading {
  const now = input.now ?? new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const personal = input.pattern.reliable;

  const startMinutes = input.dayStartMinutes ?? BATTERY_START_HOUR * 60;
  const endMinutes = Math.max(startMinutes + 120, input.dayEndMinutes ?? BATTERY_END_HOUR * 60);

  const baseAt = (minutes: number) => {
    const h = Math.floor(minutes / 60) % 24;
    const v = personal ? input.pattern.byHour[h] : null;
    return v == null ? genericLevel(h) : levelToPercent(v);
  };

  // Ankare: punkter där vi vet hur det faktiskt känns. Morgonens och kvällens
  // egna ifyllnader väger lika tungt som FlowScore just nu.
  const anchors: { minutes: number; delta: number }[] = [];
  if (input.morningLevel != null) {
    anchors.push({
      minutes: startMinutes,
      delta: clamp(input.morningLevel, 0, 100) - baseAt(startMinutes),
    });
  }
  anchors.push({ minutes: nowMinutes, delta: clamp(input.flowNow, 0, 100) - baseAt(nowMinutes) });
  if (input.eveningLevel != null) {
    anchors.push({
      minutes: endMinutes,
      delta: clamp(input.eveningLevel, 0, 100) - baseAt(endMinutes),
    });
  }
  anchors.sort((a, b) => a.minutes - b.minutes);

  /** Mjuk övergång mellan ankarpunkterna. */
  const offsetAt = (m: number) => {
    if (anchors.length === 1) return anchors[0].delta;
    if (m <= anchors[0].minutes) return anchors[0].delta;
    const last = anchors[anchors.length - 1];
    if (m >= last.minutes) return last.delta;
    for (let i = 1; i < anchors.length; i += 1) {
      const a = anchors[i - 1];
      const b = anchors[i];
      if (m <= b.minutes) {
        const span = Math.max(1, b.minutes - a.minutes);
        const t = (m - a.minutes) / span;
        return a.delta + (b.delta - a.delta) * t;
      }
    }
    return last.delta;
  };

  // Energiflöde™ har redan hänt – det syns i den passerade delen av kurvan.
  const flowNet = input.energyFlowNet ?? 0;

  const timed = input.items
    .map((it) => {
      const start = it.time ? timeToMinutes(it.time) : null;
      if (start == null) return null;
      const end = it.endTime ? (timeToMinutes(it.endTime) ?? start) : start;
      return { item: it, start, end: Math.max(end, start) };
    })
    .filter((x): x is { item: BatteryItem; start: number; end: number } => x !== null)
    .sort((a, b) => a.start - b.start);

  // Energiflöde™ syns i den passerade delen: det har redan hänt.
  const flowPart = flowNet * 1.5;

  const slots: BatterySlot[] = [];
  for (let m = startMinutes; m <= endMinutes; m += SLOT_MINUTES) {
    // Ackumulerad påverkan av allt som avslutats fram till den här punkten.
    let effect = 0;
    for (const t of timed) {
      if (t.end <= m) effect += itemCost(t.item);
    }
    const past = m <= nowMinutes;
    slots.push({
      minutes: m,
      time: minutesToTime(m),
      level: clamp(baseAt(m) + offsetAt(m) + effect + flowPart),
      past,
    });
  }

  const future = slots.filter((s) => !s.past);
  const scan = future.length >= 3 ? future : slots;

  const peak = windowFrom(scan, "high");
  const dip = windowFrom(scan, "low");

  const nowLevel = clamp(input.flowNow);
  const ahead = scan.slice(0, 4);
  const slope = ahead.length > 1 ? ahead[ahead.length - 1].level - ahead[0].level : 0;
  const trend: BatteryTrend = slope > 6 ? "stiger" : slope < -6 ? "sjunker" : "jamn";
  const trendLabel =
    trend === "stiger"
      ? "Energin är på väg upp"
      : trend === "sjunker"
        ? "Energin är på väg ner"
        : "Energin ligger ganska jämn";

  // Överbelastad dag: det som är kvar kostar mer än du har kvar att ge.
  const remainingCost = timed
    .filter((t) => t.end > nowMinutes)
    .reduce((s, t) => s + Math.max(0, -itemCost(t.item)), 0);
  const overloaded = remainingCost > nowLevel * 0.8 && remainingCost > 20;

  const summary = overloaded
    ? "Dagen ser tung ut. Vill du flytta något eller lägga in en paus?"
    : peak && peak.startMinutes > nowMinutes
      ? `${trendLabel} – starkast ${peak.label}.`
      : trendLabel + ".";

  return {
    slots,
    now: nowLevel,
    trend,
    trendLabel,
    peak,
    dip,
    personal,
    overloaded,
    summary,
  };
}

/** Hittar det starkaste eller svagaste sammanhängande fönstret i kurvan. */
function windowFrom(slots: BatterySlot[], kind: "high" | "low"): BatteryWindow | null {
  if (slots.length < 2) return null;
  const best = slots.reduce((a, b) =>
    kind === "high" ? (b.level > a.level ? b : a) : b.level < a.level ? b : a,
  );
  const threshold = kind === "high" ? best.level - 8 : best.level + 8;
  const idx = slots.indexOf(best);
  let start = idx;
  let end = idx;
  const ok = (s: BatterySlot) => (kind === "high" ? s.level >= threshold : s.level <= threshold);
  while (start > 0 && ok(slots[start - 1])) start -= 1;
  while (end < slots.length - 1 && ok(slots[end + 1])) end += 1;
  const startMinutes = slots[start].minutes;
  const endMinutes = slots[end].minutes + SLOT_MINUTES;
  return {
    startMinutes,
    endMinutes,
    label: `${minutesToTime(startMinutes)}–${minutesToTime(endMinutes)}`,
    level: Math.round(best.level),
  };
}

export interface BatterySuggestion {
  id: string;
  text: string;
}

/**
 * Förslag på placering: tungt när du är stark, lätt när du är låg,
 * och återhämtning när dagen ser överbelastad ut. Alltid som erbjudande.
 */
export function batterySuggestions(
  reading: BatteryReading,
  items: BatteryItem[],
  now = new Date(),
): BatterySuggestion[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const out: BatterySuggestion[] = [];

  const untimed = items.filter((i) => !i.time);
  const heavy = untimed.find((i) => i.friction === "large" || i.energyImpact === "drains");
  const light = untimed.find((i) => i.friction === "small" || i.energyImpact === "gives");

  if (reading.peak && reading.peak.startMinutes > nowMinutes && heavy) {
    out.push({
      id: "peak",
      text: `Lägg "${heavy.title}" runt ${minutesToTime(reading.peak.startMinutes)} – där brukar du vara starkast.`,
    });
  }
  if (reading.dip && reading.dip.startMinutes > nowMinutes && light) {
    out.push({
      id: "dip",
      text: `"${light.title}" passar bra ${reading.dip.label} när orken är lägre.`,
    });
  }
  if (reading.dip && reading.dip.startMinutes > nowMinutes) {
    out.push({
      id: "paus",
      text: `Lägg in 20 minuter återhämtning runt ${minutesToTime(reading.dip.startMinutes)}.`,
    });
  }
  if (reading.overloaded) {
    out.unshift({
      id: "overload",
      text: "Dagen är fullare än din nivå. Välj en sak att flytta till imorgon.",
    });
  }
  return out.slice(0, 3);
}
