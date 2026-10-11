import { useEffect, useState } from "react";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import {
  ACTIVITY_DONE_EVENT,
  detailToFlowItem,
  type ActivityDoneDetail,
} from "@/lib/activity-energy-event";
import type { FlowItem } from "@/lib/flow-items";

/**
 * Global "Hur kändes det?" – ligger i Layout och visas oavsett var i appen
 * användaren bockar av något. Samma befintliga prompt och samma data.
 */
export default function GlobalActivityEnergyPrompt() {
  const [items, setItems] = useState<FlowItem[]>([]);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<ActivityDoneDetail>).detail;
      if (!detail?.title) return;
      const item = detailToFlowItem(detail);
      setItems((prev) =>
        prev.some((queued) => queued.id === item.id && queued.dueDate === item.dueDate)
          ? prev
          : [...prev, item],
      );
    };
    window.addEventListener(ACTIVITY_DONE_EVENT, onDone);
    return () => window.removeEventListener(ACTIVITY_DONE_EVENT, onDone);
  }, []);

  const item = items[0] ?? null;
  return (
    <ActivityEnergyPrompt
      key={item ? `${item.id}|${item.dueDate ?? ""}` : "empty"}
      item={item}
      onClose={() => setItems((prev) => prev.slice(1))}
    />
  );
}
