import { emitActivityDone } from "@/lib/activity-energy-event";
import { useCallback, useMemo } from "react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import { childEventsForMyDay, linkLabelsByTask } from "@/lib/family-perspective";
import { useChildren } from "@/hooks/use-children";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { normalizeQuickflowText } from "@/lib/quickflow";
import { bucketRank } from "@/lib/quickflow-priority";
import { useFrictionLibrary } from "@/hooks/use-friction-library";
import { useDoneLog } from "@/hooks/use-done-log";
import { useInstanceStatus } from "@/hooks/use-instance-status";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { getArea } from "@/lib/life-areas";
import { routineOccursOn, type Routine } from "@/lib/recurrence";
import { occursOn } from "@/lib/recurrence";

import {
  completedBelongsToDay,
  daysUntilDate,
  priorityFor,
  sortFlowItems,
  todayISO,
  type FlowItem,
  meetingUrlFrom,
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
  /**
   * Tar bort saken helt från sin källa. Returnerar false om källan inte
   * går att ta bort härifrån (rutiner, lektioner, barnaktiviteter och
   * återkommande kalenderposter hanteras i sina egna vyer).
   */
  deleteItem: (item: FlowItem) => boolean;
} {
  const { tasks, toggleTask, deleteTask } = useTasks();
  const { reminders, toggleReminder, deleteReminder } = useReminders();
  const { lectures } = useStudySchedule();
  const targetDay = dateISO ?? todayISO();
  const isTodayView = targetDay === todayISO();
  const childEvents = useChildEvents(targetDay);
  const { toggleItem: toggleChildItem } = useChildren();
  const { items: quickflowItems, complete, uncomplete, remove: removeQuickflow } = useQuickflow();
  const { items: priorityItems, update: updatePriority, remove: removePriority } = usePriorityList();
  const { suggestFor } = useFrictionLibrary();
  const { isDone, toggleDone } = useDoneLog(targetDay);
  const { isInstanceDone, setInstanceDone } = useInstanceStatus();
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
      // Framtida uppgifter hör till sin egen dag. En öppen uppgift vars datum
      // passerat följer med in i idag tills den blir gjord – den får aldrig
      // försvinna tyst bara för att den blev sen. Det gäller även uppgifter
      // med klockslag: en missad tid är en sen uppgift, inte en borttappad
      // (riktiga möten bor i kalendern och hanteras av sin egen daglogik).
      if (isTodayView && t.dueDate && t.dueDate > today) continue;
      // En annan dag än idag visar bara det som faktiskt hör till den dagen.
      if (!isTodayView && t.dueDate !== today) continue;
      // Klara uppgifter hör till sitt PLANERADE datum – inte till dagen de
      // bockades av. Bara datumlösa uppgifter visas på avbockningsdagen.
      if (t.completed && !completedBelongsToDay(today, t.dueDate, t.completedAt)) continue;
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
        quickflowBucket: t.quickflowBucket,
        order: t.quickflowOrder,
        done: t.completed,
        completable: true,
        href: getArea(t) === "studier" ? "/studyflow" : getArea(t) === "jobb" ? "/jobb" : "/tasks",
        meetingUrl: meetingUrlFrom(t.note),
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
      // En återkommande post är EN aktivitet med en repetitionsregel. Varje
      // dag den inträffar har sin egen status – att bocka av idag får aldrig
      // ta bort morgondagens förekomst.
      const recurring = (r.repeat ?? "none") !== "none";
      const doneToday = recurring ? isInstanceDone(`reminder-${r.id}`, today) : r.completed;
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
        done: doneToday,
        // En kalenderhändelse är oftast något man faktiskt genomför
        // (möte, läkarbesök, lämning) – därför går den att bocka av.
        completable: true,
        href: "/kalender",
        meetingUrl: meetingUrlFrom(r.note),
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

    // Min dag = användarens dag. Barnens aktiviteter kommer bara med när de
    // uttryckligen kräver föräldern och inte redan har en kopplad egen uppgift.
    const myTaskIds = new Set(tasks.map((t) => t.id));
    const taskLinks = linkLabelsByTask(childEvents);
    for (const item of out) {
      if (item.source !== "uppgift") continue;
      const label = taskLinks.get(item.id.replace(/^task-/, ""));
      if (label) item.linkedLabel = label;
    }

    for (const e of childEventsForMyDay(childEvents, myTaskIds)) {
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
        linkedLabel: `${e.childName} – ${e.title}`,
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
      } else if (q.done && !completedBelongsToDay(today, qDue, q.doneAt)) continue;
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

    // Energi- och måendeloggningar ("Jag gjorde något") hör INTE hemma i
    // kalendern eller dagens lista. De är en känslo-/orkregistrering och
    // påverkar bara batteriet, energihistoriken och mönstren.

    // Dubbletter: samma sak kan finnas både som rutin och som kalenderpost
    // (t.ex. "Göra frukost 06:00"). Slå ihop dem – samma normaliserade titel
    // och samma klockslag på samma dag räknas som EN sak. Posten som redan
    // är gjord, eller som inte är en rutin, vinner.
    const normTitle = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const seen = new Map<string, number>();
    const deduped: FlowItem[] = [];
    for (const item of out) {
      const key = `${normTitle(item.title)}|${item.time ?? ""}`;
      const prevIdx = seen.get(key);
      if (prevIdx === undefined) {
        seen.set(key, deduped.length);
        deduped.push(item);
        continue;
      }
      const prev = deduped[prevIdx]!;
      // Behåll den som är gjord; annars behåll den som inte är en rutin
      // (kalenderposten/uppgiften är oftast den användaren bockar i).
      const keepNew =
        (item.done && !prev.done) ||
        (item.done === prev.done && prev.source === "rutin" && item.source !== "rutin");
      if (keepNew) deduped[prevIdx] = item;
    }

    return sortFlowItems(deduped);
  }, [
    tasks,
    reminders,
    lectures,
    childEvents,
    routines,
    quickflowItems,
    priorityItems,
    suggestFor,
    isDone,
    isInstanceDone,
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
      // Uppgifter skickar sin egen signal i useTasks – övriga källor gör det här.
      if (!item.done && !item.id.startsWith("task-")) {
        emitActivityDone({
          id: item.id,
          title: item.title,
          ...(item.dueDate ? { dueDate: item.dueDate } : {}),
        });
      }
      const [, rest] = [
        item.id.slice(0, item.id.indexOf("-")),
        item.id.slice(item.id.indexOf("-") + 1),
      ];
      if (item.id.startsWith("task-")) return toggleTask(rest);
      if (item.id.startsWith("rem-")) {
        const reminder = reminders.find((r) => r.id === rest);
        if (reminder && (reminder.repeat ?? "none") !== "none") {
          setInstanceDone(`reminder-${rest}`, targetDay, !item.done);
          return;
        }
        return toggleReminder(rest);
      }
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
    [
      toggleTask,
      toggleReminder,
      reminders,
      setInstanceDone,
      targetDay,
      toggleChildItem,
      complete,
      uncomplete,
      toggleDone,
      updatePriority,
    ],
  );

  /**
   * EN borttagning för hela appen – varje källa raderar sin egen post.
   * Rutiner, lektioner, barnaktiviteter och återkommande kalenderposter
   * returnerar false: de ska ändras i sin egen vy, inte försvinna tyst.
   */
  const deleteItem = useCallback(
    (item: FlowItem): boolean => {
      const rest = item.id.slice(item.id.indexOf("-") + 1);
      if (item.id.startsWith("task-")) {
        deleteTask(rest);
        return true;
      }
      if (item.id.startsWith("rem-")) {
        const reminder = reminders.find((r) => r.id === rest);
        // Återkommande poster tas bort i kalendern, så inte alla
        // framtida förekomster försvinner av ett misstag här.
        if (reminder && (reminder.repeat ?? "none") !== "none") return false;
        deleteReminder(rest);
        return true;
      }
      if (item.id.startsWith("qf-")) {
        removeQuickflow(rest);
        return true;
      }
      if (item.id.startsWith("prio-")) {
        removePriority(item.id.slice(5));
        return true;
      }
      return false;
    },
    [deleteTask, deleteReminder, reminders, removeQuickflow, removePriority],
  );

  return { items, today, todayOpen, todayDone, toggleItem, deleteItem };
}
