import { useMemo } from "react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import {
  journeyStatus,
  type JourneyInput,
  type JourneyStepId,
  type JourneyStepStatus,
} from "@/lib/day-journey";

export interface DayJourney {
  input: JourneyInput;
  steps: Record<JourneyStepId, JourneyStepStatus>;
  /** Dagens belastning känns tyngre än orken – steg 3 lyfts fram. */
  needsReplan: boolean;
}

/**
 * Dagens tre steg, byggda på befintliga datakällor:
 * incheckningen (ork/mående), påverkan, dagens saker och batteriet.
 * Ingen ny lagring skapas här.
 */
export function useDayJourney(): DayJourney {
  const { energyValue, moodValue } = useQuickCheckin();
  const { impact } = useImpactCheckin();
  const { openItems } = useQuickflow();
  const { todayOpen, todayDone } = useFlowItems();
  const { percent: capacityPercent } = useCapacityMode();

  const input = useMemo<JourneyInput>(
    () => ({
      ork10: energyValue ?? null,
      hasMood: moodValue != null,
      hasImpact: impact != null,
      planned: todayOpen.length + todayDone.length,
      done: todayDone.length,
      openThoughts: openItems.length,
      batteryNow: capacityPercent,
    }),
    [
      energyValue,
      moodValue,
      impact,
      todayOpen.length,
      todayDone.length,
      openItems.length,
      capacityPercent,
    ],
  );

  const steps = useMemo(() => journeyStatus(input), [input]);

  return { input, steps, needsReplan: !steps.planera.complete };
}
