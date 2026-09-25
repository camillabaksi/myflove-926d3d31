import { useCallback } from "react";

import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { adaptActivity, type AdaptiveSuggestion } from "@/lib/adaptive-activity";

/**
 * Dagens kapacitet → ett rimligt förslag på det användaren vill göra.
 *
 * Använder befintlig FlowScore™ (som i sin tur bygger på Mitt batteri,
 * mående, bokad tid m.m.). Ingen ny datainsamling och ingen ny lagring.
 * Saknas energilogg används FlowScores egen fallback – användaren får
 * alltid ett svar och behöver aldrig fylla i ett formulär först.
 */
export function useAdaptiveActivity() {
  const capacity = useCapacityMode();
  // Kapacitetsläget (användarens val) är källan – inte FlowScore.
  const flow = { score: capacity.percent, capacityMinutes: capacity.minutes, suggestedTasks: capacity.suggestedTasks };
  const { energyValue } = useQuickCheckin();

  const score = typeof flow?.score === "number" ? flow.score : null;
  const capacityMinutes = typeof flow?.capacityMinutes === "number" ? flow.capacityMinutes : null;

  const adapt = useCallback(
    (text: string, adjust?: "mindre" | "större" | null): AdaptiveSuggestion =>
      adaptActivity({ text, score, capacityMinutes, adjust }),
    [score, capacityMinutes],
  );

  return {
    adapt,
    /** Finns dagens energilogg? Styr bara en mjuk formulering, aldrig tillgång. */
    hasEnergyToday: energyValue != null,
  };
}
