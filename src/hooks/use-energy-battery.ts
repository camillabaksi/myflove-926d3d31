import { useMemo } from "react";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import {
  batterySuggestions,
  buildBattery,
  type BatteryItem,
  type BatteryReading,
  type BatterySuggestion,
} from "@/lib/energy-battery";
import { todayISO } from "@/lib/task-agenda";

/**
 * Mitt batteri™ – kombinerar det som redan finns: FlowScore (nivån nu),
 * ditt energimönster (formen på dagen), Energiflöde™ (dagens rörelse)
 * och dagens uppgifter/lektioner (vad som kostar framåt).
 * Inga nya nätverksanrop och ingen ny tabell.
 */
export function useEnergyBattery(): {
  reading: BatteryReading;
  suggestions: BatterySuggestion[];
  items: BatteryItem[];
} {
  const { flow } = useFlowScore();
  const { pattern } = useEnergyPattern();
  const { balance, settings } = useEnergyFlow();
  const { activeTasks } = useTasks();
  const { lectures } = useStudySchedule();

  const items = useMemo<BatteryItem[]>(() => {
    const today = todayISO();
    const weekday = (new Date().getDay() + 6) % 7;
    return [
      ...activeTasks
        .filter((t) => !t.dueDate || t.dueDate === today)
        .map((t) => ({
          id: t.id,
          title: t.title,
          time: t.time,
          endTime: t.endTime,
          energyImpact: t.energyImpact,
          friction: t.friction,
        })),
      ...lectures
        .filter((l) => l.weekday === weekday)
        .map((l) => ({
          id: `lecture-${l.id}`,
          title: l.title,
          time: l.start,
          endTime: l.end,
          energyImpact: "drains" as const,
          friction: "medium" as const,
        })),
    ];
  }, [activeTasks, lectures]);

  const reading = useMemo(
    () =>
      buildBattery({
        pattern,
        flowNow: flow.score,
        items,
        energyFlowNet: settings.enabled ? balance.weightedNet : 0,
      }),
    [pattern, flow.score, items, balance.weightedNet, settings.enabled],
  );

  const suggestions = useMemo(() => batterySuggestions(reading, items), [reading, items]);

  return { reading, suggestions, items };
}
