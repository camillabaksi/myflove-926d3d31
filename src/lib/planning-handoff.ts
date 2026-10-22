import type { LifeArea } from "@/lib/life-areas";
import type { PlanningDraft, PlanningPeriod } from "@/lib/planning";

export type PlanningAudience = "me" | "children";

/**
 * A route-local handoff for UNCONFIRMED planning input.
 *
 * - Kept only in JS memory, never localStorage/cloud and never an actual task.
 * - Separated by audience and by the currently active account.
 * - Taken (consumed) on return, so a saved or abandoned old draft cannot
 *   silently reappear on a later visit.
 * - Gone on reload/tab close. This is navigation recovery, not a backup.
 */
export interface PlanningHandoff {
  target: "me" | "children" | "both";
  period: PlanningPeriod;
  date: string;
  weekAnchor: string;
  selected: string[];
  text: string;
  rows: PlanningDraft[];
  periodAreas: Record<string, LifeArea>;
  stage: "write" | "review";
}

let currentOwner: string | null = null;
const handoffs = new Map<PlanningAudience, PlanningHandoff>();

function ownerIsCurrent(owner: string): boolean {
  return Boolean(owner) && currentOwner === owner;
}

export function takePlanningHandoff(owner: string, audience: PlanningAudience): PlanningHandoff | null {
  if (!owner) return null;
  if (currentOwner !== owner) {
    handoffs.clear();
    currentOwner = owner;
  }
  const saved = handoffs.get(audience);
  handoffs.delete(audience);
  return saved ? structuredClone(saved) : null;
}

export function rememberPlanningHandoff(owner: string, audience: PlanningAudience, draft: PlanningHandoff): void {
  // A stale component unmounting after an account switch must not overwrite
  // or resurrect private draft content for another account.
  if (!ownerIsCurrent(owner)) return;
  if (!draft.text.trim() && draft.rows.length === 0) {
    handoffs.delete(audience);
    return;
  }
  handoffs.set(audience, structuredClone(draft));
}

export function discardPlanningHandoff(owner: string, audience: PlanningAudience): void {
  if (ownerIsCurrent(owner)) handoffs.delete(audience);
}

/** Also used when the signed-in account is explicitly cleared. */
export function clearPlanningHandoffs(): void {
  handoffs.clear();
  currentOwner = null;
}
