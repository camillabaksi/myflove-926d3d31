import type { FlowItem } from "@/lib/flow-items";

/**
 * EN gemensam signal för "något blev klart".
 * Alla avcheckningar i appen skickar samma händelse, och en enda global
 * "Hur kändes det?"-ruta lyssnar. Ingen ny datamodell – bara en händelse.
 */
export const ACTIVITY_DONE_EVENT = "myflove:activity-done";

export type ActivityDoneDetail = {
  id: string;
  title: string;
  dueDate?: string;
};

export function emitActivityDone(detail: ActivityDoneDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ActivityDoneDetail>(ACTIVITY_DONE_EVENT, { detail }));
}

/** Minimal FlowItem-form som "Hur kändes det?" behöver. */
export function detailToFlowItem(detail: ActivityDoneDetail): FlowItem {
  return {
    id: detail.id,
    title: detail.title,
    ...(detail.dueDate ? { dueDate: detail.dueDate } : {}),
  } as FlowItem;
}
