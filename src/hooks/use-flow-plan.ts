import { useEffect, useMemo, useState } from "react";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { todayISO } from "@/lib/day";
import { buildFlowPlan, type FlowPlan } from "@/lib/flow-plan";
import type { PlanInput } from "@/lib/priority-engine";
import type { FlowItem } from "@/lib/flow-items";
import { usePlaceContext } from "@/hooks/use-place-context";
import { isAvailableAtPlace, type PlaceContext } from "@/lib/place-context";

export type FlowPlanItem = PlanInput & { flowItem: FlowItem };
type PlaceAwareFlowPlan = FlowPlan<FlowPlanItem> & {
  unavailableByPlace: FlowItem[];
  place: PlaceContext | null;
};

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
 * Delad FlowPlan för vald dag. Framtida dagar visas neutralt eftersom orken ännu är okänd.
 * Dagens plan använder kapacitetsläget; inget batteri är input.
 */
export function useFlowPlan(skip: string[] = [], targetDay: string = todayISO()): PlaceAwareFlowPlan {
  const isToday = targetDay === todayISO();
  const { todayOpen } = useFlowItems(targetDay);
  const { mode } = useCapacityMode();
  const { place } = usePlaceContext();
  const [minutes, setMinutes] = useState(nowMinutes);

  useEffect(() => {
    if (!isToday) return;
    const id = window.setInterval(() => setMinutes(nowMinutes()), 60_000);
    return () => window.clearInterval(id);
  }, [isToday]);

  // Framtida ork är okänd; visa en neutral förhandsplan utan dagens kapacitetsläge.
  const planMode = isToday ? mode : "fullt";
  const skipKey = skip.join("|");
  return useMemo(
    () => {
      const items = todayOpen.map(toPlanInput);
      // Platsvalet påverkar endast dagens valbara förslag. Morgondagens förhandsplan är oförändrad.
      const activePlace = isToday ? place : null;
      const available = items.filter((item) => isAvailableAtPlace(item.flowItem, activePlace));
      const unavailableByPlace = activePlace
        ? items.filter((item) => !isAvailableAtPlace(item.flowItem, activePlace)).map((item) => item.flowItem)
        : [];
      const plan = buildFlowPlan(available, {
        mode: planMode,
        today: targetDay,
        nowMinutes: isToday ? minutes : 0,
        skip: skipKey ? skipKey.split("|") : [],
      });
      return { ...plan, unavailableByPlace, place: activePlace };
    },
    [todayOpen, planMode, targetDay, isToday, minutes, skipKey, place],
  );
}
