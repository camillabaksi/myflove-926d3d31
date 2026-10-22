import type { ActivityInstance } from "@/lib/activity-history";
import type { FlowItem } from "@/lib/flow-items";

/** History's source IDs are not identical to the display IDs used by the
 * shared "Hur kändes det?" prompt (reminder-... versus rem-...).
 * Mapping the identity preserves factor reuse and the existing journal key. */
export function historyEnergyFlowItem(item: Pick<ActivityInstance, "sourceId" | "title" | "plannedDate">): FlowItem {
  return {
    id: item.sourceId.startsWith("reminder-")
      ? `rem-${item.sourceId.slice("reminder-".length)}`
      : item.sourceId,
    title: item.title,
    dueDate: item.plannedDate,
  } as FlowItem;
}
