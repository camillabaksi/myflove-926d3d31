import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "../lib/storage";
import { useCloudSyncedStorage } from "../lib/cloud-storage";
import { useCloudSyncedList } from "../lib/cloud-list";
import { trackEvent, track } from "../lib/analytics";
import type { LifeArea } from "../lib/life-areas";
import { flowDone } from "@/lib/flow-signal";
import { todayISO } from "@/lib/day";
import { SECURE_UNLOCK_EVENT, unlockSecureLocal } from "@/lib/secure-local";
import {
  MEDICATIONS_KEY,
  MEDICATION_LOG_KEY,
  dedupeMedications,
  migrateMedicationStorage,
  mergeMedicationLog,
  type Medication,
  type MedicationLogEntry,
} from "@/lib/medications";

export interface Focus {
  text: string;
  completed: boolean;
  date: string; // ISO date string for matching "today"
}

// Blueprint 2.0 §7.4: skiljer på Uppgift / Ärende / Projekt.
// Status följer Blueprint: Väntar på / Pågår / Klart.
export type TaskKind = "uppgift" | "arende" | "projekt";
export type TaskStatus = "pagar" | "vantar" | "klart";

export interface TaskStep {
  id: string;
  title: string;
  done: boolean;
  when?: string; // valfri kort tidsmarkering, t.ex. "senast 12 sep"
}

/** Uppladdat dokument kopplat till en uppgift (studieflödet). */
export interface TaskAttachment {
  path: string; // sökväg i study-docs-bucketen
  name: string;
  size?: number;
  uploadedAt: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM (t.ex. "11:00" för ett möte)
  endTime?: string; // HH:MM, valfri sluttid
  reminderMinutesBefore?: number; // valfri påminnelse: minuter före `time`
  snoozedUntil?: string; // ISO date string YYYY-MM-DD; hidden from view until this date has passed
  kind?: TaskKind; // default "uppgift"
  status?: TaskStatus; // default "pagar"; "klart" ⇔ completed=true
  waitingOn?: string; // fritt fält: "vem/vad vi väntar på"
  note?: string; // fri anteckning: vad det handlar om, vad du behöver ta med

  /** Förväntad energipåverkan (Att göra™): tar / ger / både och / vet inte. */
  energyImpact?: "drains" | "gives" | "both" | "unknown";
  /** Friktion/storlek: hur tungt det känns att komma igång. */
  friction?: "small" | "medium" | "large";
  /** Faktisk energipåverkan, loggad när uppgiften markerades klar. */
  actualEnergy?: "drains" | "gives" | "both" | "unknown";
  /** När den faktiska energin loggades. */
  actualEnergyAt?: number;

  /** Koppling till QuickFlows gemensamma uppgiftspost. */
  quickflowId?: string;
  quickflowBucket?: "nu" | "sedan" | "om-du-orkar" | "kan-vanta";
  quickflowOrder?: number;

  steps?: TaskStep[]; // delsteg (särskilt för ärenden och projekt)
  area?: LifeArea; // livsområde: vardag / privat / studier / jobb
  courseId?: string; // kopplad kurs (studieflödet)
  attachments?: TaskAttachment[]; // uppladdade dokument

  /** Smarta deadline-påminnelser: antal dagar innan dueDate som notis ska skickas */
  deadlineLeadDays?: number[];
  /** Klockslag för deadline-påminnelserna, HH:MM (default 09:00) */
  deadlineReminderTime?: string;
  /** Nyckel för automatgenererade poster (t.ex. StudyFlow-schemat) */
  syncKey?: string;
}

export interface ShoppingItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface MoodEntry {
  id: string;
  score: number; // 1-5
  note?: string;
  date: number; // timestamp
}

// Helpers to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export function useFocus() {
  const [focus, setFocus] = useLocalStorage<Focus | null>("myflow-focus", null);
  const [completedCount, setCompletedCount] = useLocalStorage<number>(
    "myflow-focus-completed-count",
    0,
  );

  const getTodayDateString = () => todayISO();

  const currentFocus = focus?.date === getTodayDateString() ? focus : null;

  const setTodayFocus = (text: string) => {
    setFocus({ text, completed: false, date: getTodayDateString() });
  };

  const toggleFocusCompleted = () => {
    if (currentFocus) {
      const nowCompleted = !currentFocus.completed;
      setFocus({ ...currentFocus, completed: nowCompleted });
      setCompletedCount(nowCompleted ? completedCount + 1 : Math.max(0, completedCount - 1));
    }
  };

  return { currentFocus, setTodayFocus, toggleFocusCompleted, completedFocusCount: completedCount };
}

export function useTasks() {
  const [tasks, setTasks] = useCloudSyncedStorage<Task[]>("myflow-tasks", []);

  useEffect(() => {
    const onQuickflowSync = (event: Event) => {
      const detail = (event as CustomEvent<{
        source?: string;
        id?: string;
        patch?: { title?: string; done?: boolean; doneAt?: number; bucket?: Task["quickflowBucket"]; order?: number };
      }>).detail;
      if (detail?.source !== "priority" || !detail.id || !detail.patch) return;
      const quickflowId = detail.id;
      const patch = detail.patch;
      setTasks((prev) =>
        prev.map((task) => {
          if (task.quickflowId !== quickflowId) return task;
          return {
            ...task,
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.done !== undefined
              ? {
                  completed: patch.done,
                  completedAt: patch.done ? patch.doneAt ?? Date.now() : undefined,
                  status: patch.done ? "klart" : "pagar",
                }
              : {}),
            ...(patch.bucket !== undefined ? { quickflowBucket: patch.bucket } : {}),
            ...(patch.order !== undefined ? { quickflowOrder: patch.order } : {}),
          };
        }),
      );
    };
    const onQuickflowDelete = (event: Event) => {
      const detail = (event as CustomEvent<{ source?: string; id?: string }>).detail;
      if (detail?.source !== "priority" || !detail.id) return;
      setTasks((prev) => prev.filter((task) => task.quickflowId !== detail.id));
    };
    window.addEventListener("myflove:quickflow-sync", onQuickflowSync);
    window.addEventListener("myflove:quickflow-delete", onQuickflowDelete);
    return () => {
      window.removeEventListener("myflove:quickflow-sync", onQuickflowSync);
      window.removeEventListener("myflove:quickflow-delete", onQuickflowDelete);
    };
  }, [setTasks]);

  const getTodayDateString = () => todayISO();

  const addTask = (
    title: string,
    dueDate?: string,
    opts?: {
      id?: string;
      quickflowId?: string;
      quickflowBucket?: Task["quickflowBucket"];
      quickflowOrder?: number;
      completed?: boolean;
      completedAt?: number;
      kind?: TaskKind;
      waitingOn?: string;
      note?: string;
      time?: string;
      endTime?: string;
      reminderMinutesBefore?: number;
      area?: LifeArea;
      courseId?: string;
      steps?: string[];
      deadlineLeadDays?: number[];
      deadlineReminderTime?: string;
      energyImpact?: Task["energyImpact"];
      friction?: Task["friction"];
    },
  ) => {
    // Blueprint: uppgifter ska alltid landa i kalendern så inget "försvinner".
    // Om inget datum anges kopplas uppgiften till idag.
    setTasks((prev) => [
      {
        id: opts?.id ?? generateId(),
        title,
        completed: opts?.completed ?? false,
        completedAt: opts?.completed ? (opts.completedAt ?? Date.now()) : undefined,
        createdAt: Date.now(),
        quickflowId: opts?.quickflowId,
        quickflowBucket: opts?.quickflowBucket,
        quickflowOrder: opts?.quickflowOrder,
        dueDate: dueDate ?? getTodayDateString(),
        time: opts?.time,
        endTime: opts?.endTime,
        reminderMinutesBefore: opts?.reminderMinutesBefore,
        kind: opts?.kind ?? "uppgift",
        status: opts?.completed ? "klart" : opts?.waitingOn ? "vantar" : "pagar",
        waitingOn: opts?.waitingOn,
        note: opts?.note?.trim() || undefined,
        area: opts?.area ?? "vardag",
        courseId: opts?.courseId,
        deadlineLeadDays: opts?.deadlineLeadDays,
        deadlineReminderTime: opts?.deadlineReminderTime,
        energyImpact: opts?.energyImpact,
        friction: opts?.friction,
        steps: (opts?.steps ?? []).map((s) => ({ id: generateId(), title: s, done: false })),
      },

      ...prev,
    ]);
    track("task_created", { source: "app" });
  };

  /** Fri anteckning på en uppgift – tom text tar bort anteckningen. */
  const setTaskNote = (id: string, note: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, note: note.trim() || undefined } : t)),
    );
  };

  /** Generell redigering: ändra titel, datum, tider, påminnelse, område m.m. i efterhand. */
  const updateTask = (
    id: string,
    patch: Partial<
      Pick<
        Task,
        | "title"
        | "dueDate"
        | "time"
        | "endTime"
        | "reminderMinutesBefore"
        | "note"
        | "area"
        | "kind"
        | "waitingOn"
        | "energyImpact"
        | "friction"
        | "actualEnergy"
        | "quickflowId"
        | "quickflowBucket"
        | "quickflowOrder"
      >
    >,
  ) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: Task = { ...t, ...patch };
        if (patch.title !== undefined) next.title = patch.title.trim() || t.title;
        if (patch.note !== undefined) next.note = patch.note.trim() || undefined;
        if (patch.time !== undefined && !patch.time) {
          next.time = undefined;
          next.endTime = undefined;
          next.reminderMinutesBefore = undefined;
        }
        return next;
      }),
    );
    if (task?.quickflowId && typeof window !== "undefined") {
      const syncPatch: { title?: string; bucket?: Task["quickflowBucket"]; order?: number } = {};
      if (patch.title !== undefined) syncPatch.title = patch.title.trim() || task.title;
      if (patch.quickflowBucket !== undefined) syncPatch.bucket = patch.quickflowBucket;
      if (patch.quickflowOrder !== undefined) syncPatch.order = patch.quickflowOrder;
      if (Object.keys(syncPatch).length > 0) {
        window.dispatchEvent(
          new CustomEvent("myflove:quickflow-sync", {
            detail: { source: "task", id: task.quickflowId, patch: syncPatch },
          }),
        );
      }
    }
  };

  const setTaskDueDate = (id: string, dueDate: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate } : t)));
  };

  const setTaskArea = (id: string, area: LifeArea) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, area } : t)));
  };

  const setTaskTime = (id: string, time: string | undefined, reminderMinutesBefore?: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, time, reminderMinutesBefore: time ? reminderMinutesBefore : undefined }
          : t,
      ),
    );
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const nowCompleted = task ? !task.completed : false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          completed: nowCompleted,
          completedAt: nowCompleted ? Date.now() : undefined,
          status: nowCompleted ? "klart" : "pagar",
        };
      }),
    );
    if (task && task.quickflowId && typeof window !== "undefined") {
      const completedAt = nowCompleted ? Date.now() : undefined;
      window.dispatchEvent(
        new CustomEvent("myflove:quickflow-sync", {
          detail: {
            source: "task",
            id: task.quickflowId,
            patch: { done: nowCompleted, doneAt: completedAt },
          },
        }),
      );
    }
    if (task && !task.completed) {
      track("task_completed", { source: "app" });
      flowDone(task.title);
    } else if (task) {
      track("task_reopened", { source: "app" });
    }
  };

  const setTaskStatus = (id: string, status: TaskStatus, waitingOn?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status,
          completed: status === "klart",
          waitingOn: status === "vantar" ? (waitingOn ?? t.waitingOn ?? "") : undefined,
        };
      }),
    );
  };

  /** Faktisk energipåverkan efter att uppgiften markerats klar – alltid frivilligt. */
  const setTaskActualEnergy = (id: string, actualEnergy: Task["actualEnergy"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, actualEnergy, actualEnergyAt: Date.now() } : t)),
    );
  };

  const setTaskKind = (id: string, kind: TaskKind) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, kind } : t)));
  };

  const addTaskStep = (id: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, steps: [...(t.steps ?? []), { id: generateId(), title, done: false }] }
          : t,
      ),
    );
  };

  /** Lägger till flera delsteg på en gång (t.ex. Flows uppdelning av en inlämning). */
  const addTaskSteps = (id: string, steps: { title: string; when?: string }[]) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              steps: [
                ...(t.steps ?? []),
                ...steps.map((s) => ({
                  id: generateId(),
                  title: s.title,
                  done: false,
                  when: s.when,
                })),
              ],
            }
          : t,
      ),
    );
  };

  /** Smarta deadline-påminnelser: X dagar innan förfallodatum. */
  const setTaskDeadlineReminders = (id: string, leadDays: number[], time?: string) => {
    const clean = Array.from(new Set(leadDays.filter((d) => d >= 0))).sort((a, b) => b - a);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, deadlineLeadDays: clean, deadlineReminderTime: time ?? t.deadlineReminderTime }
          : t,
      ),
    );
  };

  const setTaskCourse = (id: string, courseId: string | undefined) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, courseId } : t)));
  };

  const addTaskAttachment = (id: string, attachment: TaskAttachment) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, attachments: [...(t.attachments ?? []), attachment] } : t,
      ),
    );
  };

  const removeTaskAttachment = (id: string, path: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, attachments: (t.attachments ?? []).filter((a) => a.path !== path) }
          : t,
      ),
    );
  };

  const toggleTaskStep = (taskId: string, stepId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: (t.steps ?? []).map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
            }
          : t,
      ),
    );
  };

  const deleteTaskStep = (taskId: string, stepId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, steps: (t.steps ?? []).filter((s) => s.id !== stepId) } : t,
      ),
    );
  };

  /**
   * Synkar automatgenererade poster (t.ex. StudyFlow-schemat) in i kalendern.
   * Befintliga poster med samma syncKey behålls (så klarmarkeringar överlever),
   * poster som inte längre finns i planen tas bort om de inte är klara.
   */
  const syncGeneratedTasks = (
    prefix: string,
    entries: Array<{
      syncKey: string;
      title: string;
      dueDate: string;
      time?: string;
      reminderMinutesBefore?: number;
      area?: LifeArea;
      courseId?: string;
    }>,
  ) => {
    setTasks((prev) => {
      const wanted = new Map(entries.map((e) => [e.syncKey, e]));
      const kept = prev.filter((t) => {
        if (!t.syncKey?.startsWith(prefix)) return true;
        return t.completed || wanted.has(t.syncKey);
      });
      const updated = kept.map((t) => {
        const e = t.syncKey ? wanted.get(t.syncKey) : undefined;
        if (!e || t.completed) return t;
        return {
          ...t,
          title: e.title,
          dueDate: e.dueDate,
          time: e.time,
          reminderMinutesBefore: e.reminderMinutesBefore,
          area: e.area ?? t.area,
          courseId: e.courseId ?? t.courseId,
        };
      });
      const existingKeys = new Set(updated.map((t) => t.syncKey).filter(Boolean));
      const created: Task[] = entries
        .filter((e) => !existingKeys.has(e.syncKey))
        .map((e) => ({
          id: generateId(),
          title: e.title,
          completed: false,
          createdAt: Date.now(),
          dueDate: e.dueDate,
          time: e.time,
          reminderMinutesBefore: e.reminderMinutesBefore,
          kind: "uppgift" as TaskKind,
          status: "pagar" as TaskStatus,
          area: e.area ?? "studier",
          courseId: e.courseId,
          syncKey: e.syncKey,
        }));
      return [...created, ...updated];
    });
    return entries.length;
  };

  const deleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (task?.quickflowId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("myflove:quickflow-delete", {
          detail: { source: "task", id: task.quickflowId },
        }),
      );
    }
  };

  const snoozeTask = (id: string, days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const untilStr = until.toISOString().split("T")[0] as string;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, snoozedUntil: untilStr } : t)));
  };

  const unsnoozeTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, snoozedUntil: undefined } : t)));
  };

  const isSnoozed = (t: Task) => !!t.snoozedUntil && t.snoozedUntil > getTodayDateString();

  const activeTasks = tasks
    .filter((t) => !t.completed && !isSnoozed(t))
    .sort((a, b) => b.createdAt - a.createdAt);
  const completedTasks = tasks
    .filter((t) => t.completed)
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt));
  const snoozedTasks = tasks
    .filter((t) => !t.completed && isSnoozed(t))
    .sort((a, b) => (a.snoozedUntil ?? "").localeCompare(b.snoozedUntil ?? ""));

  return {
    tasks,
    activeTasks,
    completedTasks,
    snoozedTasks,
    addTask,
    toggleTask,
    deleteTask,
    snoozeTask,
    unsnoozeTask,
    setTaskStatus,
    setTaskKind,
    setTaskActualEnergy,

    setTaskDueDate,
    setTaskTime,
    setTaskArea,
    setTaskNote,
    updateTask,

    addTaskStep,
    addTaskSteps,
    setTaskCourse,
    setTaskDeadlineReminders,
    addTaskAttachment,
    removeTaskAttachment,
    toggleTaskStep,
    deleteTaskStep,
    syncGeneratedTasks,
  };
}

export function useShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>("myflow-shopping", []);

  const addItem = (title: string) => {
    setItems((prev) => [
      { id: generateId(), title, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
  };

  const toggleItem = (id: string) => {
    const item = items.find((t) => t.id === id);
    setItems(items.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    if (item && !item.completed) trackEvent("shopping", "item_bought");
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((t) => t.id !== id));
  };

  const activeItems = items.filter((t) => !t.completed).sort((a, b) => b.createdAt - a.createdAt);
  const completedItems = items.filter((t) => t.completed).sort((a, b) => b.createdAt - a.createdAt);

  return { items, activeItems, completedItems, addItem, toggleItem, deleteItem };
}

// Local shopping items are used as a fallback for the shared, household-backed
// list (see use-shared-shopping-list.ts) so proximity alerts and the dashboard
// shortcut always have a source of truth even for users without a family.
export function useActiveShoppingItemCount(): number {
  const [items] = useLocalStorage<ShoppingItem[]>("myflow-shopping", []);
  return items.filter((t) => !t.completed).length;
}

/**
 * Mående – kontobunden källa (user_kv "myflow-moods", samma nyckel som
 * MCP-verktyget log_mood). Lokal lagring är bara cache/offline-läge.
 */
export function useMoods() {
  const [moods, setMoods] = useCloudSyncedList<MoodEntry>("myflow-moods");

  const addMood = (score: number, note: string) => {
    setMoods([{ id: generateId(), score, note, date: Date.now() }, ...moods]);
    // Ett event per registrering – aldrig själva måendevärdet eller texten.
    track("mood_checkin_completed", { source: "mande", method: "formular" });
  };

  return { moods, addMood, setMoods };
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: number; // timestamp
}

/** Ekonomi – kontobunden källa (user_kv "myflow-finances"). */
export function useFinances() {
  const [transactions, setTransactions] = useCloudSyncedList<Transaction>("myflow-finances");

  const addTransaction = (transaction: Omit<Transaction, "id" | "date"> & { date?: number }) => {
    setTransactions([
      {
        id: generateId(),
        date: transaction.date || Date.now(),
        ...transaction,
      },
      ...transactions,
    ]);
    trackEvent("finances", "transaction_added");
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return { transactions, addTransaction, deleteTransaction };
}

export type BudgetPeriod = "day" | "week" | "month";

export interface BudgetSettings {
  /** Totalbudget per period, kr */
  total: Partial<Record<BudgetPeriod, number>>;
  /** Kategoribudget per period, kr */
  categories: Record<string, Partial<Record<BudgetPeriod, number>>>;
}

const EMPTY_BUDGET: BudgetSettings = { total: {}, categories: {} };

export function useBudget() {
  const [budget, setBudget] = useCloudSyncedStorage<BudgetSettings>("myflove-budget", EMPTY_BUDGET);

  const safe: BudgetSettings = {
    total: budget?.total ?? {},
    categories: budget?.categories ?? {},
  };

  const setTotal = (period: BudgetPeriod, amount: number | null) => {
    const next = { ...safe, total: { ...safe.total } };
    if (amount === null || !Number.isFinite(amount) || amount <= 0) delete next.total[period];
    else next.total[period] = amount;
    setBudget(next);
    trackEvent("finances", "budget_set");
  };

  const setCategory = (category: string, period: BudgetPeriod, amount: number | null) => {
    const cats = { ...safe.categories, [category]: { ...(safe.categories[category] ?? {}) } };
    if (amount === null || !Number.isFinite(amount) || amount <= 0) delete cats[category]![period];
    else cats[category]![period] = amount;
    if (Object.keys(cats[category] ?? {}).length === 0) delete cats[category];
    setBudget({ ...safe, categories: cats });
    trackEvent("finances", "budget_set");
  };

  return { budget: safe, setTotal, setCategory };
}

export type RepeatMode = "none" | "daily" | "weekdays" | "weekly";

export interface Reminder {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD (startdatum om återkommande eller period)
  /** Slutdatum för längre perioder, t.ex. semester eller resa (YYYY-MM-DD). */
  endDate?: string;
  time?: string; // HH:MM
  endTime?: string; // HH:MM, valfri sluttid
  completed: boolean;
  createdAt: number;
  repeat?: RepeatMode; // default 'none'
  remindMinutesBefore?: number; // notis X min innan starttid (0 = vid start)
  note?: string; // fri anteckning om vad det gäller
  area?: LifeArea; // livsområde – styr färgen i alla vyer
  canceled?: boolean; // avbokad – ligger kvar men ger inga notiser
}

export function useReminders() {
  const [reminders, setReminders] = useCloudSyncedStorage<Reminder[]>("myflow-reminders", []);

  const addReminder = (
    title: string,
    date: string,
    time?: string,
    repeat: RepeatMode = "none",
    endTime?: string,
    remindMinutesBefore?: number,
    note?: string,
    area?: LifeArea,
    endDate?: string,
  ) => {
    setReminders([
      {
        id: generateId(),
        title,
        date,
        endDate: endDate && endDate > date ? endDate : undefined,
        time,
        endTime,
        completed: false,
        createdAt: Date.now(),
        repeat,
        remindMinutesBefore,
        note: note?.trim() || undefined,
        area,
      },
      ...reminders,
    ]);
    track("reminder_created", { source: "app" });
  };

  const toggleReminder = (id: string) => {
    const before = reminders.find((r) => r.id === id);
    setReminders(reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
    if (before && !before.completed) track("reminder_completed", { source: "app" });
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const updateReminder = (
    id: string,
    patch: {
      title?: string;
      date?: string;
      endDate?: string | undefined;
      time?: string | undefined;
      endTime?: string | undefined;
      repeat?: RepeatMode;
      remindMinutesBefore?: number | undefined;
      note?: string | undefined;
      area?: LifeArea;
    },
  ) => {
    setReminders(
      reminders.map((r) => {
        if (r.id !== id) return r;
        const next: Reminder = { ...r, ...patch };
        if (next.endDate && next.endDate <= next.date) next.endDate = undefined;
        if (patch.note !== undefined) next.note = patch.note.trim() || undefined;
        if (patch.time !== undefined && !patch.time) {
          next.time = undefined;
          next.endTime = undefined;
          next.remindMinutesBefore = undefined;
        }
        return next;
      }),
    );
  };

  const cancelReminder = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, canceled: true } : r)));
  };

  const restoreReminder = (id: string) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, canceled: false } : r)));
  };

  const activeReminders = reminders
    .filter((r) => !r.completed && !r.canceled)
    .sort((a, b) => {
      // Sort by date then time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });

  return {
    reminders,
    activeReminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    updateReminder,
    cancelReminder,
    restoreReminder,
  };
}

export type { Medication, MedicationLogEntry } from "@/lib/medications";

export function useMedications() {
  // Medicin och medicinlogg synkas till molnet (som rutinerna) så att listan
  // finns kvar efter utloggning och på andra enheter. Lokalt ligger den kvar
  // krypterad via secure-local, så appen fungerar offline.
  const [medications, setMedications] = useCloudSyncedStorage<Medication[]>(MEDICATIONS_KEY, []);
  const [log, setLog] = useCloudSyncedStorage<MedicationLogEntry[]>(MEDICATION_LOG_KEY, []);
  const [ready, setReady] = useState(false);

  const medsRef = useRef(medications);
  medsRef.current = medications;
  const logRef = useRef(log);
  logRef.current = log;

  // Migrera gamla nycklar/format en gång per session – och igen när den
  // krypterade lagringen låsts upp (då blir gammal data först läsbar).
  // Det som hittas lokalt lyfts upp i molnet så att det aldrig försvinner igen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = () => {
      const result = migrateMedicationStorage();
      if (
        result.medications.length > 0 &&
        JSON.stringify(result.medications) !== JSON.stringify(medsRef.current)
      ) {
        setMedications(dedupeMedications([...medsRef.current, ...result.medications]));
      }
      if (result.log.length > 0 && JSON.stringify(result.log) !== JSON.stringify(logRef.current)) {
        setLog(mergeMedicationLog(logRef.current, result.log));
      }
      setReady(true);
    };
    void unlockSecureLocal().then(run).catch(run);
    window.addEventListener(SECURE_UNLOCK_EVENT, run);
    return () => window.removeEventListener(SECURE_UNLOCK_EVENT, run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTodayDateString = () => todayISO();

  const addMedication = (
    name: string,
    times: string[],
    dosage?: string,
    repeat: Medication["repeat"] = "daily",
    startDate?: string,
  ) => {
    setMedications(
      dedupeMedications([
        {
          id: generateId(),
          name,
          dosage,
          times: [...times].sort(),
          createdAt: Date.now(),
          repeat,
          ...(startDate ? { startDate } : {}),
        },
        ...medications,
      ]),
    );
  };

  const deleteMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
    setLog(log.filter((l) => l.medId !== id));
  };

  const isTaken = (medId: string, time: string, date: string = getTodayDateString()) =>
    log.some((l) => l.medId === medId && l.time === time && l.date === date);

  const toggleTaken = (medId: string, time: string) => {
    const date = getTodayDateString();
    if (isTaken(medId, time, date)) {
      setLog(log.filter((l) => !(l.medId === medId && l.time === time && l.date === date)));
    } else {
      setLog([...log, { medId, time, date }]);
      trackEvent("medicin", "dose_taken");
    }
  };

  return { medications, addMedication, deleteMedication, isTaken, toggleTaken, log, ready };
}

export interface DumpIdea {
  id: string;
  text: string;
  createdAt: number;
}

export function useDumpIdeas() {
  const [ideas, setIdeas] = useLocalStorage<DumpIdea[]>("myflow-dump-ideas", []);

  const addIdea = (text: string) => {
    setIdeas([{ id: generateId(), text, createdAt: Date.now() }, ...ideas]);
    trackEvent("dump", "idea_saved");
  };

  const deleteIdea = (id: string) => {
    setIdeas(ideas.filter((i) => i.id !== id));
  };

  /** Töm idébanken – används när idéerna flyttat in i Anteckningar. */
  const clearIdeas = () => setIdeas([]);

  return { ideas, addIdea, deleteIdea, clearIdeas };
}

export interface SavedStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  alertEnabled: boolean;
  /** Hur nära butiken du ska vara innan påminnelsen kommer (meter). */
  alertRadiusMeters?: number;
  createdAt: number;
}

export const DEFAULT_STORE_RADIUS_METERS = 300;

export const STORE_RADIUS_OPTIONS: { meters: number; label: string; hint: string }[] = [
  { meters: 80, label: "I affären", hint: "Bara när du står i butiken" },
  { meters: 300, label: "Alldeles nära", hint: "När du är precis utanför" },
  { meters: 1000, label: "I området", hint: "När du är i närheten" },
];

export function useSavedStores() {
  const [savedStores, setSavedStores] = useLocalStorage<SavedStore[]>("myflow-saved-stores", []);

  const addSavedStore = (name: string, lat: number, lon: number) => {
    setSavedStores((prev) => [
      {
        id: generateId(),
        name,
        lat,
        lon,
        alertEnabled: true,
        alertRadiusMeters: DEFAULT_STORE_RADIUS_METERS,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const deleteSavedStore = (id: string) => {
    setSavedStores((prev) => prev.filter((s) => s.id !== id));
  };

  const setStoreAlert = (id: string, alertEnabled: boolean) => {
    setSavedStores((prev) => prev.map((s) => (s.id === id ? { ...s, alertEnabled } : s)));
  };

  const setStoreRadius = (id: string, alertRadiusMeters: number) => {
    setSavedStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, alertRadiusMeters, alertEnabled: true } : s)),
    );
  };

  return { savedStores, addSavedStore, deleteSavedStore, setStoreAlert, setStoreRadius };
}

export interface SavedTrip {
  id: string;
  label: string;
  from: string;
  to: string;
  createdAt: number;
  alertEnabled?: boolean;
  alertMinutesBefore?: number;
}

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useLocalStorage<SavedTrip[]>("myflow-saved-trips", []);

  const addSavedTrip = (label: string, from: string, to: string) => {
    setSavedTrips([{ id: generateId(), label, from, to, createdAt: Date.now() }, ...savedTrips]);
  };

  const deleteSavedTrip = (id: string) => {
    setSavedTrips(savedTrips.filter((t) => t.id !== id));
  };

  const setTripAlert = (id: string, alertEnabled: boolean, alertMinutesBefore?: number) => {
    setSavedTrips(
      savedTrips.map((t) =>
        t.id === id
          ? {
              ...t,
              alertEnabled,
              alertMinutesBefore: alertMinutesBefore ?? t.alertMinutesBefore ?? 15,
            }
          : t,
      ),
    );
  };

  return { savedTrips, addSavedTrip, deleteSavedTrip, setTripAlert };
}
