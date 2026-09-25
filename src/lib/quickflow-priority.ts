/**
 * QuickFlow – "Jag har mycket på en gång".
 *
 * Ren logik för att dela upp en fritext i flera saker och lägga dem i fyra
 * lugna nivåer. Ingen tid, inget datum, ingen kalenderhändelse skapas här.
 * AI-prioriteringen bor i quickflow-priority.functions.ts; den här filen är
 * fallback + typer och används av hooken och UI:t.
 */

import type { TaskClarification } from "./quickflow-clarify";
import {
  QUICKFLOW_LABEL,
  bucketToPriority,
  classifyPriority,
  priorityToBucket,
  type QuickflowBucket,
} from "./priority-engine";

/** Lagringsvärde för P1–P4 (presentation). Prioriteten kommer från priority-engine. */
export type PriorityBucket = QuickflowBucket;

export interface PriorityTask {
  id: string;
  title: string;
  bucket: PriorityBucket;
  /** Kort förklaring från Flow – aldrig en påhittad deadline. */
  why?: string;
  order: number;
  /** Flows förtydligande: varför + energiuppskattning + första steg. */
  clarify?: TaskClarification;
  done?: boolean;
  doneAt?: number;
  createdAt: number;
}

/** Ordning P1 → P4. */
export const BUCKETS: PriorityBucket[] = ([1, 2, 3, 4] as const).map(priorityToBucket);

const DOTS = { 1: "bg-primary", 2: "bg-sun", 3: "bg-muted", 4: "bg-mint" } as const;
const MARKS = { 1: "◉", 2: "🟠", 3: "⚪", 4: "🟢" } as const;

export const BUCKET_META = Object.fromEntries(
  BUCKETS.map((b) => {
    const p = bucketToPriority(b);
    return [b, { emoji: MARKS[p], label: QUICKFLOW_LABEL[p], dot: DOTS[p] }];
  }),
) as Record<PriorityBucket, { emoji: string; label: string; dot: string }>;

/** Rang = P-nivå minus 1. Gamla/okända värden översätts via priority-engine. */
export function bucketRank(b: PriorityBucket | string | undefined): number {
  return bucketToPriority(b) - 1;
}

const SPLIT = /\n|;|,| och | samt | sen | sedan | dessutom |·|•/gi;

/** Delar upp fritext i flera saker – en per rad eller separerade med komma/och. */
export function splitTasks(raw: string): string[] {
  return raw
    .replace(/\.\s+/g, "\n")
    .split(SPLIT)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .map((s) => s.replace(/[.]+$/, "").trim())
    .filter((s) => s.length > 1)
    .slice(0, 20);
}

/**
 * Fallback när AI inte är tillgänglig. Prioriteten kommer ENBART från
 * priority-engine – kapacitet/batteri ändrar aldrig en uppgifts prioritet.
 * Parametern `_energyPercent` finns kvar för bakåtkompatibla anrop.
 */
export function heuristicPriority(titles: string[], _energyPercent?: number): PriorityTask[] {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  return titles
    .map((title, i) => ({ i, p: classifyPriority({ id: String(i), title }, today) }))
    .sort((a, b) => a.p.priority - b.p.priority || a.i - b.i)
    .map(({ i, p }, order) => ({
      id: `${now}-${i}`,
      title: p.item.title,
      bucket: priorityToBucket(p.priority),
      why: p.reason,
      order,
      createdAt: now,
    }));
}

/** Stödjande mening utifrån batteriet – aldrig ett krav. */
export function energyHint(energyPercent?: number): string {
  if (typeof energyPercent !== "number")
    return "Jag sorterar det viktigaste först. Du väljer själv var du börjar.";
  if (energyPercent < 40)
    return "Du har ganska lite energi just nu. Jag skulle börja med en liten uppgift som är viktig men inte kräver mycket av dig.";
  if (energyPercent > 70)
    return "Du har gott om energi just nu. Det här kan vara ett bra tillfälle att ta den uppgift som kräver mest fokus.";
  return "Energin är mitt emellan. Ta en sak i taget – det räcker.";
}

/** Sorterar listan efter nivå och användarens egen ordning. */
export function sortPriority(items: PriorityTask[]): PriorityTask[] {
  return [...items].sort(
    (a, b) => bucketRank(a.bucket) - bucketRank(b.bucket) || a.order - b.order,
  );
}
