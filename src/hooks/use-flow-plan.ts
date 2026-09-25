import { useEffect, useMemo, useState } from "react";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { todayISO } from "@/lib/day";
import { buildFlowPlan, type FlowPlan } from "@/lib/flow-plan";
import type { PlanInput } from "@/lib/priority-engine";
import type { FlowItem } from "@/lib/flow-items";

export type FlowPlanItem = PlanInput & { flowItem: FlowItem };

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Samma översättning överallt: FlowItem → det priority-engine behöver. */
export function toPlanInput(i: FlowItem): FlowPlanItem {
  return {
    id: i.id,
    title: i.title,
    time: i.time,
    dueDate: i.dueDate,
    fixed: i.source === "kalender" || i.source === "lektion",
    movable: i.id.startsWith("task-"),
    flowItem: i,
  };
}

/**
 * Dagens FlowPlan – det Hem, Nästa steg, Idag och Flow visar.
 * Inputs: dagens öppna saker + kapacitetsläget. Inget batteri.
 */
export function useFlowPlan(skip: string[] = []): FlowPlan<FlowPlanItem> {
  const { todayOpen } = useFlowItems();
  const { mode } = useCapacityMode();
  const [minutes, setMinutes] = useState(nowMinutes);

  useEffect(() => {
    const id = window.setInterval(() => setMinutes(nowMinutes()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const skipKey = skip.join("|");
  return useMemo(
    () =>
      buildFlowPlan(todayOpen.map(toPlanInput), {
        mode,
        today: todayISO(),
        nowMinutes: minutes,
        skip: skipKey ? skipKey.split("|") : [],
      }),
    [todayOpen, mode, minutes, skipKey],
  );
}
