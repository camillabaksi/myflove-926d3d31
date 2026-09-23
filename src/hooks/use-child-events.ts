import { useMemo } from "react";
import { useChildren } from "@/hooks/use-children";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { ChildScheduleEntry } from "@/components/child-schedule";

const SCHEDULE_KEY = "myflove-child-schedules";

export interface ChildEvent {
  /** HH:MM */
  time: string;
  title: string;
  childName: string;
  childId: string;
  place?: string;
  /** Id på barnaktiviteten när den kommer från barnens lista (kan bockas av). */
  itemId?: string;
  completed?: boolean;
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
        out.push({ time: e.start, title: e.title, childName, childId, place: e.location });
      }
    }

    for (const i of items) {
      if (!i.time || i.date !== today) continue;
      const childName = nameOf.get(i.child_id);
      if (!childName) continue;
      out.push({
        time: i.time.slice(0, 5),
        title: i.title,
        childName,
        childId: i.child_id,
        itemId: i.id,
        completed: i.completed,
      });
    }

    return out.sort((a, b) => a.time.localeCompare(b.time));
  }, [children, items, schedules, dateISO]);
}
