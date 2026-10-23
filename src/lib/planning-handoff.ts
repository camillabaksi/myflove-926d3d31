import type { LifeArea } from "@/lib/life-areas";
import type { PlanningDraft, PlanningPeriod } from "@/lib/planning";
import { isActiveOwner } from "@/lib/account-scope";
import { getSecureStatus, secureGetItem, secureSetItem } from "@/lib/secure-local";

export type PlanningAudience = "me" | "children";

/**
 * A route-local handoff for UNCONFIRMED planning input.
 *
 * - Kept only in JS memory, never localStorage/cloud and never an actual task.
 * - Separated by audience and by the currently active account.
 * - Read on return, then cleared after the page mounts. This stays safe
 *   under React StrictMode, which may initialize components more than once.
 * - A separate encrypted, local-only snapshot also recovers after reload.
 * - Never synced to cloud, sent to analytics, or created as a task.
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

export const PLANNING_DRAFT_KEYS = {
  me: "myflove-planning-draft-me-v1",
  children: "myflove-planning-draft-children-v1",
} as const;

type Stored = { version: 1; owner: string; draft: PlanningHandoff | null };
const hasContent = (draft: PlanningHandoff) => Boolean(draft.text.trim() || draft.rows.length);

/** Only read after AES-GCM unlock, for the active authenticated account. */
export function readEncryptedPlanningHandoff(owner: string, audience: PlanningAudience): PlanningHandoff | null {
  if (!owner || !isActiveOwner(owner) || getSecureStatus() !== "ready") return null;
  try {
    const raw = secureGetItem(PLANNING_DRAFT_KEYS[audience]);
    if (!raw) return null;
    const saved: Stored = JSON.parse(raw);
    const value = saved?.draft;
    if (saved.version !== 1 || saved.owner !== owner || !value ||
        typeof value !== "object" || typeof value.text !== "string" ||
        typeof value.date !== "string" || typeof value.weekAnchor !== "string" ||
        !Array.isArray(value.rows) || value.rows.length > 50 ||
        !Array.isArray(value.selected) || value.selected.length > 100 ||
        value.selected.some((id) => typeof id !== "string") ||
        value.text.length > 13_000 ||
        !["me", "children", "both"].includes(value.target) ||
        !["today", "tomorrow", "week"].includes(value.period) ||
        !["write", "review"].includes(value.stage) ||
        !value.periodAreas || typeof value.periodAreas !== "object" ||
        !value.rows.every((row) => row && typeof row.id === "string" &&
          typeof row.title === "string" && row.title.length <= 240 &&
          typeof row.date === "string" && typeof row.time === "string" &&
          typeof row.endTime === "string" && typeof row.location === "string" &&
          Array.isArray(row.childIds) && row.childIds.every((id: unknown) => typeof id === "string") &&
          row.childItemIds && typeof row.childItemIds === "object") ||
        !hasContent(value)) return null;
    return structuredClone(value);
  } catch {
    return null;
  }
}

/** Local-only and encrypted; a blank draft becomes a content-free tombstone. */
export function persistPlanningHandoff(owner: string, audience: PlanningAudience, draft: PlanningHandoff): void {
  if (!ownerIsCurrent(owner) || !isActiveOwner(owner)) return;
  const value: Stored = { version: 1, owner, draft: hasContent(draft) ? structuredClone(draft) : null };
  secureSetItem(PLANNING_DRAFT_KEYS[audience], JSON.stringify(value));
}

export function clearEncryptedPlanningHandoff(owner: string, audience: PlanningAudience): void {
  if (!ownerIsCurrent(owner) || !isActiveOwner(owner)) return;
  secureSetItem(PLANNING_DRAFT_KEYS[audience], JSON.stringify({ version: 1, owner, draft: null } satisfies Stored));
}

let currentOwner: string | null = null;
const handoffs = new Map<PlanningAudience, PlanningHandoff>();

function ownerIsCurrent(owner: string): boolean {
  return Boolean(owner) && currentOwner === owner;
}

export function readPlanningHandoff(owner: string, audience: PlanningAudience): PlanningHandoff | null {
  if (!owner) return null;
  if (currentOwner !== owner) {
    handoffs.clear();
    currentOwner = owner;
  }
  const saved = handoffs.get(audience);
  return saved ? structuredClone(saved) : readEncryptedPlanningHandoff(owner, audience);
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
