// Regelmotor för "Ditt fokus idag".
//
// En enda tydlig plats som avgör om en aktivitet hör hemma i dagens fokus.
// Grundregeln: fokus handlar om *idag*. Något som gäller ett framtida datum
// ska ligga kvar i framtiden – inte skava i dagens vy.

import type { Task } from "@/hooks/use-data";
import { todayISO } from "@/lib/daily-flow";

export type FocusRuleId =
  | "klar"
  | "snoozad"
  | "auto-genererad"
  | "forsenad"
  | "gäller-idag"
  | "utan-datum"
  | "framtida-datum";

export interface FocusDecision {
  /** Ska aktiviteten visas i "Ditt fokus idag"? */
  include: boolean;
  /** Vilken regel som avgjorde. */
  rule: FocusRuleId;
  /** Kort förklaring i Flow-röst, går att visa i UI. */
  reason: string;
}

/** Antal dagar mellan idag och ett ISO-datum (negativt = passerat). */
export function daysUntilDate(dueDate: string, today = todayISO()): number {
  const a = Date.parse(`${today}T00:00:00`);
  const b = Date.parse(`${dueDate}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Automatgenererade poster som aldrig ska styra dagens fokus. */
const AUTO_KEYS = [":exam:", ":revision:"];

/**
 * Reglerna, i prioritetsordning:
 * 1. Klar → nej.
 * 2. Snoozad till senare datum → nej.
 * 3. Automatgenererad (prov/repetition) → nej.
 * 4. Deadline har passerat → ja (försenad, får en varsam knuff).
 * 5. Deadline är idag → ja.
 * 6. Deadline i framtiden → nej, oavsett klockslag.
 * 7. Inget datum alls → ja (flexibel, kan göras när som helst).
 */
export function evaluateFocus(task: Task, today = todayISO()): FocusDecision {
  if (task.completed) {
    return { include: false, rule: "klar", reason: "Redan klar." };
  }

  if (task.snoozedUntil && task.snoozedUntil > today) {
    return { include: false, rule: "snoozad", reason: "Du har lagt undan den till senare." };
  }

  if (task.syncKey && AUTO_KEYS.some((k) => task.syncKey!.includes(k))) {
    return {
      include: false,
      rule: "auto-genererad",
      reason: "Automatisk post – styr inte dagens fokus.",
    };
  }

  if (!task.dueDate) {
    return { include: true, rule: "utan-datum", reason: "Inget datum – kan göras när det passar." };
  }

  const days = daysUntilDate(task.dueDate, today);

  if (days < 0) {
    return { include: true, rule: "forsenad", reason: "Datumet har passerat." };
  }
  if (days === 0) {
    return { include: true, rule: "gäller-idag", reason: "Gäller idag." };
  }
  return {
    include: false,
    rule: "framtida-datum",
    reason: days === 1 ? "Gäller imorgon – väntar." : `Gäller om ${days} dagar – väntar.`,
  };
}

/** Bekvämlighet: filtrera en lista till det som hör hemma i dagens fokus. */
export function focusTasksForToday(tasks: Task[], today = todayISO()): Task[] {
  return tasks.filter((t) => evaluateFocus(t, today).include);
}

/** Det som medvetet väntar – bra att kunna visa som "Resten kan vänta". */
export function deferredTasksForToday(
  tasks: Task[],
  today = todayISO(),
): Array<{ task: Task; decision: FocusDecision }> {
  return tasks
    .map((task) => ({ task, decision: evaluateFocus(task, today) }))
    .filter(({ decision }) => !decision.include && decision.rule !== "klar");
}
