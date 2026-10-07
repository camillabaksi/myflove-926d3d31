import { useMemo } from "react";
import { useChildren } from "@/hooks/use-children";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { activityOccursOn, decodeVisualNotes } from "@/lib/child-visual-schedule";
import type { ChildScheduleEntry } from "@/components/child-schedule";

const SCHEDULE_KEY = "myflove-child-schedules";

export interface ChildEvent {
  /** HH:MM */
  time: string;
  /** HH:MM, när sluttid finns. */
  endTime?: string;
  title: string;
  childName: string;
  childId: string;
  place?: string;
  /** Original ID; context is never a parent's completable task. */
  itemId?: string;
  completed?: boolean;
  /** Förälderns egen markering – aldrig ett energivärde. */
  requiresParent?: boolean;
  prepMinutes?: number;
  travelMinutes?: number;
  recoveryAfter?: boolean;
  /** Koppling till andra barns aktiviteter. */
  linkGroup?: string;
  /** Koppling till förälderns egen uppgift. */
  parentTaskId?: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Barnens hållpunkter en viss dag (default idag) – skolschema och inlagda aktiviteter med klockslag.
 * Samma format som lektioner, så livspusslet kan räkna med dem.
 */
export function useChildEvents(dateISO?: string): ChildEvent[] {
  const { children, items } = useChildren();
  const [schedules] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(SCHEDULE_KEY, {});

  return useMemo(() => {
    const today = dateISO ?? todayISO();
    const weekday = (new Date(`${today}T00:00:00`).getDay() + 6) % 7;
    const nameOf = new Map(children.map((c) => [c.id, c.name]));
    const out: ChildEvent[] = [];

    for (const [childId, entries] of Object.entries(schedules ?? {})) {
      const childName = nameOf.get(childId);
      if (!childName) continue;
      for (const e of entries ?? []) {
        if (e.weekday !== weekday) continue;
        out.push({ time: e.start, endTime: e.end, title: e.title, childName, childId, place: e.location, requiresParent: false });
      }
    }

    for (const i of items) {
      if (i.kind !== "activity" || !i.time || !activityOccursOn(i, today)) continue;
      const childName = nameOf.get(i.child_id);
      if (!childName) continue;
      const { meta } = decodeVisualNotes(i.notes);
      out.push({
        time: i.time.slice(0, 5),
        ...(meta.endTime ? { endTime: meta.endTime } : {}),
        title: i.title,
        childName,
        childId: i.child_id,
        itemId: i.id,
        completed: i.completed,
        ...(typeof meta.parentPresence === "boolean" ? { requiresParent: meta.parentPresence } : {}),
        ...(meta.prepMinutes ? { prepMinutes: meta.prepMinutes } : {}),
        ...(meta.travelMinutes ? { travelMinutes: meta.travelMinutes } : {}),
        ...(meta.recoveryAfter ? { recoveryAfter: true } : {}),
        ...(meta.linkGroup ? { linkGroup: meta.linkGroup } : {}),
        ...(meta.parentTaskId ? { parentTaskId: meta.parentTaskId } : {}),
      });
    }

    return out.sort((a, b) => a.time.localeCompare(b.time));
  }, [children, items, schedules, dateISO]);
}
