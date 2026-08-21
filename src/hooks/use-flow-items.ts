import { useCallback, useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import { useChildren } from "@/hooks/use-children";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFrictionLibrary } from "@/hooks/use-friction-library";
import { useDoneLog } from "@/hooks/use-done-log";
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
 * Här finns också EN gemensam avcheckning (`toggleItem`). Alla vyer – Hem,
 * Min dag, Flow och Att göra – använder samma funktion, så status blir
 * densamma överallt utan parallella check-off-system.
 */
export function useFlowItems(): {
  items: FlowItem[];
  today: FlowItem[];
  /** Dagens genomförbara saker som ännu inte är gjorda. */
  todayOpen: FlowItem[];
  /** Dagens saker som redan är genomförda. */
  todayDone: FlowItem[];
  toggleItem: (item: FlowItem) => void;
} {
  const { tasks, toggleTask } = useTasks();
  const { reminders, toggleReminder } = useReminders();
  const { lectures } = useStudySchedule();
  const childEvents = useChildEvents();
  const { toggleItem: toggleChildItem } = useChildren();
  const { items: quickflowItems, complete, uncomplete } = useQuickflow();
  const { suggestFor } = useFrictionLibrary();
  const { isDone, toggleDone } = useDoneLog();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);

  const items = useMemo<FlowItem[]>(() => {
    const today = todayISO();
    const weekday = (new Date().getDay() + 6) % 7;
    const out: FlowItem[] = [];

    const isSnoozed = (until?: string) => !!until && until > today;

    const isToday = (ms?: number) => {
      if (!ms) return false;
      const d = new Date(ms);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return iso === today;
    };

    for (const t of tasks) {
      if (isSnoozed(t.snoozedUntil)) continue;
      // Klara uppgifter visas bara om de hör till idag eller bockades av idag –
      // så att dagen kan visa både det som återstår och det som redan är gjort.
      if (t.completed && t.dueDate !== today && !isToday(t.completedAt)) continue;
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
        priority:
          t.completed && isToday(t.completedAt)
            ? "idag"
            : priorityFor({ time: t.time, daysUntil: d }),
        energy: friction?.friction,
        energyReason: friction?.reason,
        nextStep,
        done: t.completed,
        completable: true,
        href:
          getArea(t) === "studier" ? "/studyflow" : getArea(t) === "jobb" ? "/workflow" : "/tasks",
      });
    }

    for (const r of reminders) {
      if (r.date !== today || r.canceled) continue;
      out.push({
        id: `rem-${r.id}`,
        title: r.title,
        source: "kalender",
        area: getArea(r),
        emoji: "📅",
        time: r.time,
        dueDate: r.date,
        daysUntil: 0,
        priority: priorityFor({ time: r.time, daysUntil: 0, fixed: true }),
        done: r.completed,
        // En kalenderhändelse är oftast något man faktiskt genomför
        // (möte, läkarbesök, lämning) – därför går den att bocka av.
        completable: true,
        href: "/kalender",
      });
    }

    for (const l of lectures) {
      if (l.weekday !== weekday) continue;
      const id = `lec-${l.id}`;
      out.push({
        id,
        title: l.title,
        source: "lektion",
        area: "studier",
        emoji: "🎓",
        time: l.start,
        daysUntil: 0,
        priority: priorityFor({ time: l.start, daysUntil: 0, fixed: true }),
        nextStep: l.location ? `Plats: ${l.location}` : undefined,
        done: isDone(id),
        completable: true,
        href: "/studyflow",
      });
    }

    for (const e of childEvents) {
      const id = e.itemId ? `childitem-${e.itemId}` : `child-${e.childName}-${e.time}-${e.title}`;
      out.push({
        id,
        title: `${e.title} (${e.childName})`,
        source: "barn",
        area: "barn",
        emoji: "🧒",
        time: e.time,
        daysUntil: 0,
        priority: priorityFor({ time: e.time, daysUntil: 0, fixed: true }),
        nextStep: e.place ? `Plats: ${e.place}` : undefined,
        done: e.itemId ? !!e.completed : isDone(id),
        completable: true,
        href: "/barn",
      });
    }

    for (const r of routines ?? []) {
      if (!r.enabled || !r.time) continue;
      const id = `routine-${r.id}`;
      out.push({
        id,
        title: r.title,
        source: "rutin",
        area: "vardag",
        emoji: "🔁",
        time: r.time,
        daysUntil: 0,
        priority: priorityFor({ time: r.time, daysUntil: 0, fixed: true }),
        done: isDone(id),
        completable: true,
        href: "/daglig-rutin",
      });
    }

    for (const q of quickflowItems) {
      const friction = suggestFor(q.text);
      // Har tanken en tid framåt hör den till den dagen, inte till idag.
      const qDate = q.remindAt ? new Date(q.remindAt) : null;
      const qDue = qDate
        ? `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, "0")}-${String(qDate.getDate()).padStart(2, "0")}`
        : undefined;
      const qDays = qDue ? daysUntilDate(qDue) : undefined;
      if (q.done && qDue !== today) continue;
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
        done: q.done,
        completable: true,
        href: "/quickflow",
      });
    }

    return sortFlowItems(out);
  }, [tasks, reminders, lectures, childEvents, routines, quickflowItems, suggestFor, isDone]);

  const today = useMemo(
    () => items.filter((i) => i.priority === "nu" || i.priority === "idag"),
    [items],
  );

  const todayOpen = useMemo(() => today.filter((i) => !i.done), [today]);
  const todayDone = useMemo(() => today.filter((i) => i.done), [today]);

  /** EN avcheckning för hela appen – varje källa uppdaterar sin egen status. */
  const toggleItem = useCallback(
    (item: FlowItem) => {
      if (!item.completable) return;
      const [, rest] = [
        item.id.slice(0, item.id.indexOf("-")),
        item.id.slice(item.id.indexOf("-") + 1),
      ];
      if (item.id.startsWith("task-")) return toggleTask(rest);
      if (item.id.startsWith("rem-")) return toggleReminder(rest);
      if (item.id.startsWith("childitem-")) {
        void toggleChildItem(rest, !item.done);
        return;
      }
      if (item.id.startsWith("qf-")) {
        if (item.done) uncomplete(rest);
        else complete(rest);
        return;
      }
      // Rutiner, lektioner och schemarader: dagsbaserad genomförandelogg.
      toggleDone(item.id);
    },
    [toggleTask, toggleReminder, toggleChildItem, complete, uncomplete, toggleDone],
  );

  return { items, today, todayOpen, todayDone, toggleItem };
}
