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
  const [item, setItem] = useState<FlowItem | null>(null);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<ActivityDoneDetail>).detail;
      if (!detail?.title) return;
      setItem(detailToFlowItem(detail));
    };
    window.addEventListener(ACTIVITY_DONE_EVENT, onDone);
    return () => window.removeEventListener(ACTIVITY_DONE_EVENT, onDone);
  }, []);

  return <ActivityEnergyPrompt item={item} onClose={() => setItem(null)} />;
}
