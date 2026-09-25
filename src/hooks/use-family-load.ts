import { useMemo } from "react";

import { useChildEvents } from "@/hooks/use-child-events";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useActivityHistory } from "@/hooks/use-activity-history";
import { capacityLevel } from "@/lib/recovery-gaps";
import {
  buildFamilyLoad,
  familyPatternNote,
  type FamilyLoadItem,
  type FamilyLoadSummary,
} from "@/lib/family-load";

/**
 * Familjens åtaganden idag, vägda mot förälderns befintliga batteri och
 * FlowScore. Ingen ny lagring, inget nytt batteri – bara en läsning av det
 * som redan finns.
 */
export function useFamilyLoad(dateISO?: string): FamilyLoadSummary {
  const events = useChildEvents(dateISO);
  const { reading } = useEnergyBattery();
  const { flow } = useFlowScore();
  const { records } = useActivityHistory();

  const patternNote = useMemo(() => {
    // Bara användarens egna svar på "Hur kändes det?" för familjeaktiviteter.
    const family = records.filter((r) => r.sourceId.includes("childitem-") && !!r.energyImpact);
    const drains = family.filter(
      (r) => r.energyImpact === "drains_much" || r.energyImpact === "drains_little",
    ).length;
    return familyPatternNote({ drains, logged: family.length });
  }, [records]);

  return useMemo(() => {
    const now = new Date();
    const items: FamilyLoadItem[] = events.map((e) => ({
      time: e.time,
      ...(e.endTime ? { endTime: e.endTime } : {}),
      title: e.title,
      childName: e.childName,
      ...(typeof e.requiresParent === "boolean" ? { requiresParent: e.requiresParent } : {}),
      ...(e.prepMinutes ? { prepMinutes: e.prepMinutes } : {}),
      ...(e.travelMinutes ? { travelMinutes: e.travelMinutes } : {}),
      ...(e.recoveryAfter ? { recoveryAfter: true } : {}),
      ...(e.completed ? { completed: true } : {}),
    }));

    return buildFamilyLoad({
      items,
      batteryPercent: capacityPercent,
      capacity: capacityLevel(typeof flow?.score === "number" ? flow.score : null),
      nowMinutes: now.getHours() * 60 + now.getMinutes(),
      patternNote,
    });
  }, [events, capacityPercent, flow?.score, patternNote]);
}
