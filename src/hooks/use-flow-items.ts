import { useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFrictionLibrary } from "@/hooks/use-friction-library";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { getArea } from "@/lib/life-areas";
import type { Routine } from "@/pages/routines";
import {
  daysUntilDate,
  priorityFor,
  sortFlowItems,
  todayISO,
  type FlowItem,
} from "@/lib/flow-items";

/**
 * Den delade selektorn: allt som är en "sak i livet" samlas här i ett och
 * samma format, oavsett vilken del av appen det skapades i.
 *
 * Tanken är att en skoluppgift med deadline ska nå Min dag, hemskärmen och
 * Flow utan att någon behöver flytta den manuellt.
 */
export function useFlowItems(): { items: FlowItem[]; today: FlowItem[] } {
  const { activeTasks } = useTasks();
  const { activeReminders } = useReminders();
  const { lectures } = useStudySchedule();
  const childEvents = useChildEvents();
  const { openItems } = useQuickflow();
  const { suggestFor } = useFrictionLibrary();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);

  const items = useMemo<FlowItem[]>(() => {
    const today = todayISO();
    const weekday = (new Date().getDay() + 6) % 7;
    const out: FlowItem[] = [];

    for (const t of activeTasks) {
      const d = t.dueDate ? daysUntilDate(t.dueDate) : undefined;
      const friction = suggestFor(t.title);
      const nextStep = t.steps?.find((s) => !s.done)?.title;
      out.push({
        id: `task-${t.id}`,
        title: t.title,
        source: "uppgift",
        area: getArea(t),
        emoji: "✅",
        time: t.time,
        dueDate: t.dueDate,
        daysUntil: d,
        priority: priorityFor({ time: t.time, daysUntil: d }),
        energy: friction?.friction,
        energyReason: friction?.reason,
        nextStep,
        done: t.completed,
        href:
          getArea(t) === "studier" ? "/studyflow" : getArea(t) === "jobb" ? "/workflow" : "/tasks",
      });
    }

    for (const r of activeReminders) {
      if (r.date !== today) continue;
      out.push({
        id: `rem-${r.id}`,
        title: r.title,
        source: "kalender",
        area: "vardag",
        emoji: "📅",
        time: r.time,
        dueDate: r.date,
        daysUntil: 0,
        priority: priorityFor({ time: r.time, daysUntil: 0, fixed: true }),
        href: "/kalender",
      });
    }

    for (const l of lectures) {
      if (l.weekday !== weekday) continue;
      out.push({
        id: `lec-${l.id}`,
        title: l.title,
        source: "lektion",
        area: "studier",
        emoji: "🎓",
        time: l.start,
        daysUntil: 0,
        priority: priorityFor({ time: l.start, daysUntil: 0, fixed: true }),
        nextStep: l.location ? `Plats: ${l.location}` : undefined,
        href: "/studyflow",
      });
    }

    for (const e of childEvents) {
      out.push({
        id: `child-${e.childName}-${e.time}-${e.title}`,
        title: `${e.title} (${e.childName})`,
        source: "barn",
        area: "privat",
        emoji: "🧒",
        time: e.time,
        daysUntil: 0,
        priority: priorityFor({ time: e.time, daysUntil: 0, fixed: true }),
        nextStep: e.place ? `Plats: ${e.place}` : undefined,
        href: "/barn",
      });
    }

    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      out.push({
        id: `routine-${r.id}`,
        title: r.title,
        source: "rutin",
        area: "vardag",
        emoji: "🔁",
        time: r.time,
        daysUntil: 0,
        priority: priorityFor({ time: r.time, daysUntil: 0, fixed: true }),
        href: "/daglig-rutin",
      });
    }

    for (const q of openItems) {
      if (q.done) continue;
      const friction = suggestFor(q.text);
      // Har tanken en tid framåt hör den till den dagen, inte till idag.
      const qDate = q.remindAt ? new Date(q.remindAt) : null;
      const qDue = qDate
        ? `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, "0")}-${String(qDate.getDate()).padStart(2, "0")}`
        : undefined;
      const qDays = qDue ? daysUntilDate(qDue) : undefined;
      out.push({
        id: `qf-${q.id}`,
        title: q.text,
        source: "tanke",
        area: q.area ?? "vardag",
        emoji: "💭",
        dueDate: qDue,
        daysUntil: qDays,
        priority:
          typeof qDays === "number"
            ? priorityFor({ daysUntil: qDays })
            : q.level === "viktigt"
              ? "idag"
              : "senare",
        energy: friction?.friction,
        energyReason: friction?.reason,
        href: "/quickflow",
      });
    }

    return sortFlowItems(out);
  }, [activeTasks, activeReminders, lectures, childEvents, routines, openItems, suggestFor]);

  const today = useMemo(
    () => items.filter((i) => i.priority === "nu" || i.priority === "idag"),
    [items],
  );

  return { items, today };
}
