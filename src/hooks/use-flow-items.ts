import { useCallback, useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import { useChildren } from "@/hooks/use-children";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { normalizeQuickflowText } from "@/lib/quickflow";
import { bucketRank } from "@/lib/quickflow-priority";
import { useFrictionLibrary } from "@/hooks/use-friction-library";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useDoneLog } from "@/hooks/use-done-log";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { getArea } from "@/lib/life-areas";
import { routineOccursOn, type Routine } from "@/lib/recurrence";
import { occursOn } from "@/lib/recurrence";

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
export function useFlowItems(dateISO?: string): {
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
  const targetDay = dateISO ?? todayISO();
  const isTodayView = targetDay === todayISO();
  const childEvents = useChildEvents(targetDay);
  const { toggleItem: toggleChildItem } = useChildren();
  const { items: quickflowItems, complete, uncomplete } = useQuickflow();
  const { items: priorityItems, update: updatePriority } = usePriorityList();
  const { suggestFor } = useFrictionLibrary();
  const { entries: energyEntries } = useEnergyFlow();
  const { isDone, toggleDone } = useDoneLog(targetDay);
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);

  const items = useMemo<FlowItem[]>(() => {
    const today = targetDay;
    const weekday = (new Date(`${targetDay}T00:00:00`).getDay() + 6) % 7;
    const out: FlowItem[] = [];

    const isSnoozed = (until?: string) => !!until && until > today;

    /** Bockades något av på den dag vi tittar på? */
    const isToday = (ms?: number) => {
      if (!ms) return false;
      const d = new Date(ms);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return iso === today;
    };

    for (const t of tasks) {
      if (isSnoozed(t.snoozedUntil)) continue;
      // En uppgift hör till sitt eget datum. Ett datum längre fram får aldrig
      // dyka upp under en tidigare dag (t.ex. 4 sep under 22 aug).
      if (t.dueDate && t.dueDate > today) continue;
      // En annan dag än idag visar bara det som faktiskt hör till den dagen.
      if (!isTodayView && t.dueDate !== today) continue;
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
        priority: t.quickflowId
          ? t.quickflowBucket === "nu"
            ? "nu"
            : "idag"
          : t.completed && isToday(t.completedAt)
            ? "idag"
            : priorityFor({ time: t.time, daysUntil: d }),
        energy: friction?.friction,
        energyReason: friction?.reason,
        nextStep,
        quickflowId: t.quickflowId,
        order: t.quickflowOrder,
        done: t.completed,
        completable: true,
        href:
          getArea(t) === "studier" ? "/studyflow" : getArea(t) === "jobb" ? "/workflow" : "/tasks",
      });
    }

    for (const r of reminders) {
      // Datumet på påminnelsen (plus ev. upprepning) avgör dagen – aldrig när
      // den skapades. occursOn är samma logik som kalendern använder.
      if (r.canceled) continue;
      // En flerdagsperiod (t.ex. en veckas semester) hör till varje dag i
      // intervallet – exakt som i kalendern, inte bara startdagen.
      const inPeriod = !!r.endDate && today >= r.date && today <= r.endDate;
      if (!occursOn(r.date, r.repeat, today) && !inPeriod) continue;
      // Mitt i en period finns inget klockslag – bara på startdagen.
      const time = inPeriod && today !== r.date ? undefined : r.time;
      out.push({
        id: `rem-${r.id}`,
        title: r.title,
        source: "kalender",
        area: getArea(r),
        emoji: "📅",
        time,
        dueDate: r.date,
        daysUntil: 0,
        priority: priorityFor({ time, daysUntil: 0, fixed: true }),
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
      if (!r.enabled || !r.time || !routineOccursOn(r, targetDay)) continue;
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
      // En tanke med påminnelse längre fram hör till den dagen, inte till idag.
      if (qDue && qDue > today) continue;
      const qDoneToday = !!q.done && isToday(q.doneAt);
      if (!isTodayView) {
        if (qDue !== today) continue;
      } else if (q.done && qDue !== today && !qDoneToday) continue;
      out.push({
        id: `qf-${q.id}`,
        title: q.text,
        source: "tanke",
        area: q.area ?? "vardag",
        emoji: "💭",
        dueDate: qDue,
        daysUntil: qDays,
        priority: qDoneToday
          ? "idag"
          : typeof qDays === "number"
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

    // QuickFlow-poster har samma gemensamma ID som uppgiften i Idag.
    // Äldre poster utan brygga visas fortfarande tills de har migrerats.
    const linkedQuickflowIds = new Set(tasks.flatMap((task) => task.quickflowId ?? []));
    for (const p of priorityItems) {
      // Redan klara poster hör bara till den dag de bockades av.
      if (p.done && !isToday(p.doneAt)) continue;
      if (!isTodayView && !p.done) continue;
      // Den riktiga task-raden ovan är den enda visningen när bryggan finns.
      if (linkedQuickflowIds.has(p.id)) continue;
      out.push({
        id: `prio-${p.id}`,
        title: p.title,
        source: "quickflow",
        area: "vardag",
        emoji: "⚡",
        quickflowId: p.id,
        priority: p.bucket === "nu" ? "nu" : "idag",
        order: bucketRank(p.bucket) * 1000 + p.order,
        nextStep: p.clarify?.firstStep ?? undefined,
        energy:
          p.clarify?.energyLevel === "stor"
            ? 8
            : p.clarify?.energyLevel === "liten"
              ? 3
              : undefined,
        energyReason: p.why,
        done: !!p.done,
        completable: true,
        href: "/quickflow",
      });
    }

    // "Jag gjorde något" – spontana saker användaren loggat. De är redan
    // genomförda och hör till samma dag, så de syns bland dagens gjorda saker.
    // Samma post kan finnas både lokalt och i molnet under en sync – därför
    // visas varje unik post (titel + tidpunkt) bara en gång.
    const seenGjort = new Set<string>();
    for (const e of energyEntries) {
      const iso = (e.occurredAt ?? "").slice(0, 10);
      if (iso !== today) continue;
      const key = `${e.title.trim().toLowerCase()}|${(e.occurredAt ?? "").slice(0, 16)}`;
      if (seenGjort.has(key)) continue;
      seenGjort.add(key);
      out.push({
        id: `gjort-${e.id}`,
        title: e.title,
        source: "gjort",
        area: "vardag",
        emoji: e.direction === "gives" ? "🌿" : "💪",
        priority: "idag",
        done: true,
        completable: false,
        href: "/energifloede",
      });
    }

    return sortFlowItems(out);
  }, [
    tasks,
    reminders,
    lectures,
    childEvents,
    routines,
    quickflowItems,
    priorityItems,
    energyEntries,
    suggestFor,
    isDone,
    targetDay,
    isTodayView,
  ]);

  // "today" = det som hör till den valda dagen. För idag betyder det det som
  // är akut eller ska göras idag; för en annan dag är allt vi samlat in redan
  // filtrerat på just den dagen.
  const today = useMemo(
    () => (isTodayView ? items.filter((i) => i.priority === "nu" || i.priority === "idag") : items),
    [items, isTodayView],
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
      if (item.id.startsWith("prio-")) {
        const pid = item.id.slice(5);
        updatePriority(
          pid,
          item.done ? { done: false, doneAt: undefined } : { done: true, doneAt: Date.now() },
        );
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
    [toggleTask, toggleReminder, toggleChildItem, complete, uncomplete, toggleDone, updatePriority],
  );

  return { items, today, todayOpen, todayDone, toggleItem };
}
