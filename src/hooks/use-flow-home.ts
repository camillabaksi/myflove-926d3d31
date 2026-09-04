import { useMemo } from "react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { useFeatureUsage } from "@/lib/feature-usage";
import { shouldAskAboutThought, type QuickflowItem } from "@/lib/quickflow";
import { todayISO, parseISODate } from "@/lib/day";
import { flowHomePrompt, type FlowHomePrompt } from "@/lib/flow-home";
import type { ActivityInstance } from "@/lib/activity-history";

export interface FlowHomeState {
  prompt: FlowHomePrompt;
  /** Quickflow-posten som blivit liggande – null när det inte finns någon. */
  stale: QuickflowItem | null;
  /** Genomförd aktivitet idag som saknar svar om energipåverkan. */
  pending: ActivityInstance | null;
}

/**
 * Flows läge på startsidan. Läser bara befintliga datakällor:
 * ork (useQuickCheckin), Quickflow, aktivitetshistoriken och den adaptiva
 * användningsstatistiken. Ingen ny lagring skapas här.
 */
export function useFlowHome(): FlowHomeState {
  const { energyValue } = useQuickCheckin();
  const { openItems } = useQuickflow();
  const { instancesBetween } = useActivityHistory();
  const { order } = useFeatureUsage();

  const today = todayISO();

  const stale = useMemo(() => {
    const now = Date.now();
    return openItems.filter((i) => shouldAskAboutThought(i, now)).sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
  }, [openItems]);

  const pending = useMemo(() => {
    const list = instancesBetween(today, today);
    return (
      list.find((i) => i.status === "genomford" && !i.energyImpact && i.completedAt != null) ?? null
    );
  }, [instancesBetween, today]);

  const prompt = useMemo(() => {
    const now = new Date();
    return flowHomePrompt({
      hour: now.getHours(),
      isSunday: parseISODate(today).getDay() === 0,
      ork10: energyValue ?? null,
      hasStale: stale != null,
      hasPendingEnergy: pending != null,
      order,
    });
  }, [energyValue, stale, pending, order, today]);

  return { prompt, stale, pending };
}
