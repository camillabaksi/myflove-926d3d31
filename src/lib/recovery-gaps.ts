/**
 * Adaptiv återhämtning – när dagen inte går att ändra.
 *
 * Ren logik, ingen lagring och ingen ny aktivitetsmodell. Den tittar på de
 * fasta hållpunkter som redan finns (uppgifter med tid, lektioner, barnens
 * schema) och letar realistiska luckor före, mellan och efter dem. Utifrån
 * befintlig kapacitet (FlowScore™ / Mitt batteri) föreslås en återhämtning
 * som rimligen får plats.
 *
 * Inget bokas automatiskt: den som använder resultatet skapar en vanlig
 * uppgift först när användaren själv sagt ja.
 *
 * Inga medicinska påståenden – förslagen är UX-beteende, inte råd om hälsa.
 */

import { toMinutes, DEFAULT_SLOT_MINUTES } from "@/lib/booked-time";
import type { CapacityLevel } from "@/lib/adaptive-activity";

export interface FixedSlot {
  /** HH:MM */
  start: string;
  /** HH:MM, valfri. Saknas den antas en standardlängd. */
  end?: string;
  title: string;
  /** Egen hållpunkt eller något i familjen. */
  who?: "jag" | "familj";
  /** Förberedelse före hållpunkten, minuter. Ersätter standardbufferten. */
  prepMinutes?: number;
  /** Resa/förflyttning efter hållpunkten, minuter. */
  travelMinutes?: number;
  /** Användaren har själv sagt att det brukar behövas lugn stund efteråt. */
  preferAfter?: boolean;
}

export type RecoveryKind = "paus" | "ljusboost" | "stopp" | "vardag";

export interface RecoveryOption {
  id: string;
  label: string;
  emoji: string;
  minutes: number;
  kind: RecoveryKind;
  /** Befintlig vy om återhämtningen redan har en egen plats i appen. */
  href?: string;
}

export interface RecoveryGap {
  /** HH:MM */
  start: string;
  /** HH:MM */
  end: string;
  minutes: number;
  /** "16:00–16:20" */
  label: string;
  /** Vad som ligger före respektive efter luckan. */
  before: string | null;
  after: string | null;
  /** Kort beskrivning, t.ex. "Lugn stund innan Hämta barn". */
  note: string;
  /** Förvalt alternativ som får plats. */
  option: RecoveryOption;
  /** Andra alternativ som också får plats. */
  alternatives: RecoveryOption[];
}

export interface RecoveryGapsInput {
  slots: FixedSlot[];
  /** FlowScore 0–100 om det finns. */
  score?: number | null;
  /** Dagens ramar, HH:MM. */
  dayStart?: string;
  dayEnd?: string;
  /** Minuter sedan midnatt just nu. */
  nowMinutes?: number;
  /** Restid/förberedelse runt varje hållpunkt. */
  bufferMinutes?: number;
  /** Något användaren själv loggat som energigivande. */
  energyBoostTitle?: string | null;
  /** Hur många luckor som visas. */
  max?: number;
}

export interface RecoveryGapsResult {
  capacity: CapacityLevel;
  /** Sant när kapaciteten bygger på fallback i stället för dagens logg. */
  usedFallback: boolean;
  fixedCount: number;
  gaps: RecoveryGap[];
  headline: string;
  intro: string;
  /** Text när inga luckor hittades. */
  emptyNote: string | null;
  /** Mjuk formulering om tidigare loggar, aldrig som sanning. */
  preferenceNote: string | null;
}

export const MIN_GAP_MINUTES = 10;

function hhmm(total: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(total)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** FlowScore → kapacitet. Utan score används medel, aldrig ett hinder. */
export function capacityLevel(score?: number | null): CapacityLevel {
  if (score == null) return "medel";
  if (score >= 66) return "hög";
  if (score >= 40) return "medel";
  return "låg";
}

const CATALOGUE: Record<CapacityLevel, RecoveryOption[]> = {
  låg: [
    { id: "mikropaus", label: "Mikropaus", emoji: "🌿", minutes: 5, kind: "paus", href: "/aterhamtning" },
    { id: "sitta", label: "Sitta ostört en stund", emoji: "🪑", minutes: 10, kind: "vardag" },
    { id: "mat", label: "Något att äta eller dricka", emoji: "🍵", minutes: 10, kind: "vardag" },
    { id: "ljusboost", label: "Ljusboost", emoji: "🌅", minutes: 15, kind: "ljusboost", href: "/aterhamtning" },
    { id: "musik", label: "Lugn musik", emoji: "🎧", minutes: 15, kind: "vardag" },
    { id: "stopp", label: "Stopp-knappen", emoji: "✋", minutes: 5, kind: "stopp", href: "/stop-paus" },
  ],
  medel: [
    { id: "paus", label: "Paus", emoji: "🌿", minutes: 10, kind: "paus", href: "/aterhamtning" },
    { id: "ljusboost", label: "Ljusboost", emoji: "🌅", minutes: 15, kind: "ljusboost", href: "/aterhamtning" },
    { id: "luft", label: "Ut och dra frisk luft", emoji: "🍃", minutes: 15, kind: "vardag" },
    { id: "fika", label: "Fika i lugn och ro", emoji: "☕", minutes: 20, kind: "vardag" },
    { id: "promenad", label: "Kort promenad", emoji: "🚶", minutes: 25, kind: "vardag" },
  ],
  hög: [
    { id: "paus", label: "Paus", emoji: "🌿", minutes: 10, kind: "paus", href: "/aterhamtning" },
    { id: "promenad", label: "Promenad", emoji: "🚶", minutes: 25, kind: "vardag" },
    { id: "rorelse", label: "Lätt träning", emoji: "🤸", minutes: 25, kind: "vardag" },
    { id: "kreativt", label: "Något kreativt", emoji: "🎨", minutes: 20, kind: "vardag" },
    { id: "social", label: "Prata med någon du gillar", emoji: "💬", minutes: 20, kind: "vardag" },
  ],
};

/** Alternativ som rimligen får plats i luckan, längd anpassad till tiden. */
export function optionsForGap(
  gapMinutes: number,
  capacity: CapacityLevel,
  energyBoostTitle?: string | null,
): RecoveryOption[] {
  const pool = [...CATALOGUE[capacity]];
  if (energyBoostTitle && capacity !== "låg") {
    // Egna loggade aktiviteter är ett alternativ, inte det första förslaget.
    pool.splice(1, 0, {
      id: "eget",
      label: energyBoostTitle,
      emoji: "💜",
      minutes: Math.min(20, Math.max(10, gapMinutes)),
      kind: "vardag",
    });
  }
  return pool
    .filter((o) => o.minutes <= gapMinutes || o.minutes <= 10)
    .map((o) => ({ ...o, minutes: Math.max(5, Math.min(o.minutes, gapMinutes)) }))
    .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i)
    .slice(0, gapMinutes >= 40 ? 4 : gapMinutes >= 20 ? 3 : 2);
}

interface Range {
  start: number;
  end: number;
  title: string;
  preferAfter?: boolean;
}

export interface RawGap {
  start: number;
  end: number;
  before: string | null;
  after: string | null;
  /** Luckan ligger direkt efter något användaren själv markerat. */
  preferred?: boolean;
}

/** Slår ihop hållpunkterna och returnerar luckorna emellan. */
export function findGaps(
  slots: FixedSlot[],
  opts: {
    startMinutes: number;
    endMinutes: number;
    nowMinutes: number;
    bufferMinutes?: number;
    minGap?: number;
  },
): RawGap[] {
  const buffer = opts.bufferMinutes ?? 10;
  const minGap = opts.minGap ?? MIN_GAP_MINUTES;
  const from = Math.max(opts.startMinutes, opts.nowMinutes);

  const prepared = slots
    .filter((s) => /^\d{1,2}:\d{2}$/.test(s.start ?? ""))
    .map((s) => {
      const start = toMinutes(s.start);
      const rawEnd = s.end && /^\d{1,2}:\d{2}$/.test(s.end) ? toMinutes(s.end) : start + DEFAULT_SLOT_MINUTES;
      // Förberedelse och resa är användarens egen information om hållpunkten.
      // Saknas den används samma standardbuffert som tidigare.
      const before = Math.max(0, s.prepMinutes ?? buffer);
      const after = Math.max(0, s.travelMinutes ?? buffer);
      return {
        range: { start, end: Math.max(rawEnd, start + 15), title: s.title, preferAfter: s.preferAfter },
        before,
        after,
      };
    })
    .sort((a, b) => a.range.start - b.range.start);

  const ranges: Range[] = prepared.map((p) => p.range);
  // Restid och förberedelse räknas som upptaget, inte som ledig tid.
  const padded = prepared.map((p) => ({
    start: p.range.start - p.before,
    end: p.range.end + p.after,
  }));

  const out: RawGap[] = [];
  let cursor = from;
  let previous: Range | null = null;

  for (let i = 0; i < padded.length; i++) {
    const r = padded[i]!;
    if (r.end <= cursor) {
      previous = ranges[i]!;
      continue;
    }
    if (r.start - cursor >= minGap) {
      out.push({
        start: cursor,
        end: Math.min(r.start, opts.endMinutes),
        before: previous?.title ?? null,
        after: ranges[i]!.title,
        preferred: !!previous?.preferAfter,
      });
    }
    cursor = Math.max(cursor, r.end);
    previous = ranges[i]!;
  }

  if (opts.endMinutes - cursor >= minGap) {
    out.push({
      start: cursor,
      end: opts.endMinutes,
      before: previous?.title ?? null,
      after: null,
      preferred: !!previous?.preferAfter,
    });
  }

  return out.filter((g) => g.end - g.start >= minGap && g.start < opts.endMinutes);
}

/** Hela förslaget: kapacitet + luckor + en återhämtning som får plats. */
export function buildRecoveryGaps(input: RecoveryGapsInput): RecoveryGapsResult {
  const capacity = capacityLevel(input.score);
  const usedFallback = input.score == null;
  const startMinutes = toMinutes(input.dayStart ?? "07:00");
  const endMinutes = toMinutes(input.dayEnd ?? "22:00");
  const nowMinutes = input.nowMinutes ?? startMinutes;
  const max = input.max ?? 2;

  const raw = findGaps(input.slots, {
    startMinutes,
    endMinutes,
    nowMinutes,
    bufferMinutes: input.bufferMinutes,
  });

  const gaps: RecoveryGap[] = raw
    // Långa tomma kvällar är sällan det mest hjälpsamma förslaget – korta
    // luckor mellan hållpunkter kommer först.
    .sort((a, b) => a.start - b.start)
    .map((g) => {
      const minutes = Math.min(45, g.end - g.start);
      const options = optionsForGap(minutes, capacity, input.energyBoostTitle);
      const first = options[0] ?? {
        id: "mikropaus",
        label: "Mikropaus",
        emoji: "🌿",
        minutes: Math.max(5, Math.min(10, minutes)),
        kind: "paus" as const,
        href: "/aterhamtning",
      };
      return {
        start: hhmm(g.start),
        end: hhmm(g.start + first.minutes),
        minutes: first.minutes,
        label: `${hhmm(g.start)}–${hhmm(g.start + first.minutes)}`,
        before: g.before,
        after: g.after,
        note: g.after
          ? `Lugn stund innan ${g.after.toLowerCase()}`
          : g.before
            ? `Enkel återhämtning efter ${g.before.toLowerCase()}`
            : "Lite egen tid",
        option: first,
        alternatives: options.slice(1),
      };
    })
    .slice(0, max);

  const fixedCount = input.slots.length;

  return {
    capacity,
    usedFallback,
    fixedCount,
    gaps,
    headline: gaps.length
      ? "Dagen är ganska full, men allt behöver inte ändras."
      : "Dagen ser tät ut.",
    intro: gaps.length
      ? gaps.length === 1
        ? "Jag hittar ett litet utrymme för återhämtning:"
        : `Jag hittar ${gaps.length} små utrymmen för återhämtning:`
      : "",
    emptyNote: gaps.length
      ? null
      : "Jag hittar ingen lucka just nu. Det är inte ditt fel – vi kan titta igen senare idag.",
    preferenceNote: input.energyBoostTitle
      ? `Du har tidigare loggat att ${input.energyBoostTitle.toLowerCase()} ofta ger dig energi.`
      : null,
  };
}

/** Titeln som sparas när användaren säger ja – vanlig uppgift, inget nytt system. */
export function recoveryTaskTitle(option: RecoveryOption): string {
  return `${option.label} ${option.minutes} min`;
}

/** Sluttid för den valda återhämtningen. */
export function recoveryEndTime(gap: RecoveryGap, option: RecoveryOption): string {
  return hhmm(toMinutes(gap.start) + option.minutes);
}
