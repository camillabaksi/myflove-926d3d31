import { useEffect, useRef, useState } from "react";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import {
  ACTIVITY_DONE_EVENT,
  detailToFlowItem,
  type ActivityDoneDetail,
} from "@/lib/activity-energy-event";
import { ENERGY_FEEDBACK_CLEAR_EVENT } from "@/lib/energy-save-feedback";
import { getDataOwner } from "@/lib/account-scope";
import { ACCOUNT_BOUND_EVENT } from "@/lib/cloud-storage";
import type { FlowItem } from "@/lib/flow-items";

/**
 * Global "Hur kändes det?" – ligger i Layout och visas oavsett var i appen
 * användaren bockar av något. Samma befintliga prompt och samma data.
 */
export default function GlobalActivityEnergyPrompt() {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [anchorTop, setAnchorTop] = useState<number | null>(null);

  const owner = useRef(getDataOwner());
  useEffect(() => {
    const onAccountChanged = () => {
      if (owner.current !== getDataOwner()) {
        owner.current = getDataOwner();
        setItems([]);
        setAnchorTop(null);
      }
    };
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<ActivityDoneDetail>).detail;
      if (!detail?.title) return;
      const item = detailToFlowItem(detail);
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        const rect = active.getBoundingClientRect();
        setAnchorTop(Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 390)));
      } else setAnchorTop(null);
      setItems((prev) =>
        prev.some((queued) => queued.id === item.id && queued.dueDate === item.dueDate)
          ? prev
          : [...prev, item],
      );
    };
    window.addEventListener(ACTIVITY_DONE_EVENT, onDone);
    window.addEventListener(ACCOUNT_BOUND_EVENT, onAccountChanged);
    return () => {
      window.removeEventListener(ACTIVITY_DONE_EVENT, onDone);
      window.removeEventListener(ACCOUNT_BOUND_EVENT, onAccountChanged);
    };
  }, []);

  const item = items[0] ?? null;
  useEffect(() => {
    if (item) window.dispatchEvent(new Event(ENERGY_FEEDBACK_CLEAR_EVENT));
  }, [item]);
  return (
    <ActivityEnergyPrompt
      key={item ? `${item.id}|${item.dueDate ?? ""}` : "empty"}
      item={item}
      anchorTop={anchorTop}
      onClose={() => setItems((prev) => prev.slice(1))}
    />
  );
}
