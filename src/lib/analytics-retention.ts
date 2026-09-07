/**
 * Återkommande användning – mäts helt lokalt och helt anonymt.
 *
 * Vi sparar bara datum (YYYY-MM-DD) på den här enheten: första dagen appen
 * öppnades, senaste aktiva dagen och antal aktiva dagar. Utifrån det skickas
 * små, innehållslösa event ("aktiv dag", "återkom efter 7 dagar") till samma
 * anonyma statistik som resten av appen. Ingen text, inget innehåll, inga
 * personuppgifter lämnar enheten.
 */

import { track } from "@/lib/analytics";
import { todayISO } from "@/lib/day";

const KEY = "myflove-retention";

interface RetentionState {
  first: string;
  last: string;
  activeDays: number;
  /** Vilka återkomstmilstolpar som redan rapporterats. */
  milestones: number[];
}

const MILESTONES = [1, 7, 30] as const;

function read(): RetentionState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RetentionState) : null;
  } catch {
    return null;
  }
}

function write(state: RetentionState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* utan lagring blir det ingen mätning – och det är okej */
  }
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

/** Läs nuvarande läge (används av statistik och tester). */
export function retentionState(): RetentionState | null {
  if (typeof window === "undefined") return null;
  return read();
}

/**
 * Anropas en gång per appstart. Skickar högst ett par event per dygn:
 * `active_day` första gången appen används en viss dag, och `return_d1/7/30`
 * när användaren kommer tillbaka efter respektive antal dagar.
 */
export function trackRetention(): void {
  if (typeof window === "undefined") return;
  const today = todayISO();
  const prev = read();

  if (!prev) {
    write({ first: today, last: today, activeDays: 1, milestones: [] });
    track("first_open");
    track("active_day", { count: 1 });
    return;
  }

  if (prev.last === today) return; // redan räknad idag

  const state: RetentionState = {
    first: prev.first,
    last: today,
    activeDays: (prev.activeDays ?? 0) + 1,
    milestones: Array.isArray(prev.milestones) ? prev.milestones : [],
  };

  const age = daysBetween(state.first, today);
  for (const m of MILESTONES) {
    if (age >= m && !state.milestones.includes(m)) {
      state.milestones.push(m);
      track(m === 1 ? "return_d1" : m === 7 ? "return_d7" : "return_d30");
    }
  }

  write(state);
  track("active_day", { count: Math.min(state.activeDays, 999) });
}
