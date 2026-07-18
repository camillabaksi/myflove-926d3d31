import { useLocalStorage } from '../lib/storage';
import { useCloudSyncedStorage } from '../lib/cloud-storage';
import { trackEvent } from '../lib/analytics';

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
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM (t.ex. "11:00" för ett möte)
  reminderMinutesBefore?: number; // valfri påminnelse: minuter före `time`
  snoozedUntil?: string; // ISO date string YYYY-MM-DD; hidden from view until this date has passed
  kind?: TaskKind; // default "uppgift"
  status?: TaskStatus; // default "pagar"; "klart" ⇔ completed=true
  waitingOn?: string; // fritt fält: "vem/vad vi väntar på"
  steps?: TaskStep[]; // delsteg (särskilt för ärenden och projekt)
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
  const [focus, setFocus] = useLocalStorage<Focus | null>('myflow-focus', null);
  const [completedCount, setCompletedCount] = useLocalStorage<number>('myflow-focus-completed-count', 0);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

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
  const [tasks, setTasks] = useCloudSyncedStorage<Task[]>('myflow-tasks', []);

  const getTodayDateString = () => new Date().toISOString().split('T')[0] as string;

  const addTask = (
    title: string,
    dueDate?: string,
    opts?: { kind?: TaskKind; waitingOn?: string; time?: string; reminderMinutesBefore?: number }
  ) => {
    // Blueprint: uppgifter ska alltid landa i kalendern så inget "försvinner".
    // Om inget datum anges kopplas uppgiften till idag.
    setTasks((prev) => [
      {
        id: generateId(),
        title,
        completed: false,
        createdAt: Date.now(),
        dueDate: dueDate ?? getTodayDateString(),
        time: opts?.time,
        reminderMinutesBefore: opts?.reminderMinutesBefore,
        kind: opts?.kind ?? "uppgift",
        status: opts?.waitingOn ? "vantar" : "pagar",
        waitingOn: opts?.waitingOn,
        steps: [],
      },
      ...prev,
    ]);
  };

  const setTaskDueDate = (id: string, dueDate: string) => {
    setTasks((prev) => prev.map(t => (t.id === id ? { ...t, dueDate } : t)));
  };

  const setTaskTime = (id: string, time: string | undefined, reminderMinutesBefore?: number) => {
    setTasks((prev) => prev.map(t => (t.id === id
      ? { ...t, time, reminderMinutesBefore: time ? reminderMinutesBefore : undefined }
      : t)));
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks((prev) => prev.map(t => {
      if (t.id !== id) return t;
      const nowCompleted = !t.completed;
      return {
        ...t,
        completed: nowCompleted,
        completedAt: nowCompleted ? Date.now() : undefined,
        status: nowCompleted ? "klart" : "pagar",
      };
    }));
    if (task && !task.completed) trackEvent('tasks', 'task_completed');
  };

  const setTaskStatus = (id: string, status: TaskStatus, waitingOn?: string) => {
    setTasks((prev) => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        status,
        completed: status === "klart",
        waitingOn: status === "vantar" ? (waitingOn ?? t.waitingOn ?? "") : undefined,
      };
    }));
  };

  const setTaskKind = (id: string, kind: TaskKind) => {
    setTasks((prev) => prev.map(t => (t.id === id ? { ...t, kind } : t)));
  };

  const addTaskStep = (id: string, title: string) => {
    setTasks((prev) => prev.map(t => t.id === id
      ? { ...t, steps: [...(t.steps ?? []), { id: generateId(), title, done: false }] }
      : t));
  };

  const toggleTaskStep = (taskId: string, stepId: string) => {
    setTasks((prev) => prev.map(t => t.id === taskId
      ? { ...t, steps: (t.steps ?? []).map(s => s.id === stepId ? { ...s, done: !s.done } : s) }
      : t));
  };

  const deleteTaskStep = (taskId: string, stepId: string) => {
    setTasks((prev) => prev.map(t => t.id === taskId
      ? { ...t, steps: (t.steps ?? []).filter(s => s.id !== stepId) }
      : t));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter(t => t.id !== id));
  };

  const snoozeTask = (id: string, days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    const untilStr = until.toISOString().split('T')[0] as string;
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, snoozedUntil: untilStr } : t));
  };

  const unsnoozeTask = (id: string) => {
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, snoozedUntil: undefined } : t));
  };

  const isSnoozed = (t: Task) => !!t.snoozedUntil && t.snoozedUntil > getTodayDateString();

  const activeTasks = tasks
    .filter(t => !t.completed && !isSnoozed(t))
    .sort((a, b) => b.createdAt - a.createdAt);
  const completedTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt));
  const snoozedTasks = tasks
    .filter(t => !t.completed && isSnoozed(t))
    .sort((a, b) => (a.snoozedUntil ?? '').localeCompare(b.snoozedUntil ?? ''));

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
    setTaskDueDate,
    setTaskTime,
    addTaskStep,
    toggleTaskStep,
    deleteTaskStep,
  };
}

export function useShoppingList() {
  const [items, setItems] = useLocalStorage<ShoppingItem[]>('myflow-shopping', []);

  const addItem = (title: string) => {
    setItems((prev) => [{ id: generateId(), title, completed: false, createdAt: Date.now() }, ...prev]);
  };

  const toggleItem = (id: string) => {
    const item = items.find(t => t.id === id);
    setItems(items.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (item && !item.completed) trackEvent('shopping', 'item_bought');
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(t => t.id !== id));
  };

  const activeItems = items.filter(t => !t.completed).sort((a, b) => b.createdAt - a.createdAt);
  const completedItems = items.filter(t => t.completed).sort((a, b) => b.createdAt - a.createdAt);

  return { items, activeItems, completedItems, addItem, toggleItem, deleteItem };
}

// Local shopping items are used as a fallback for the shared, household-backed
// list (see use-shared-shopping-list.ts) so proximity alerts and the dashboard
// shortcut always have a source of truth even for users without a family.
export function useActiveShoppingItemCount(): number {
  const [items] = useLocalStorage<ShoppingItem[]>('myflow-shopping', []);
  return items.filter(t => !t.completed).length;
}

export function useMoods() {
  const [moods, setMoods] = useLocalStorage<MoodEntry[]>('myflow-moods', []);

  const addMood = (score: number, note: string) => {
    setMoods([{ id: generateId(), score, note, date: Date.now() }, ...moods]);
    trackEvent('mood', 'mood_logged');
  };

  return { moods, addMood };
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note?: string;
  date: number; // timestamp
}

export function useFinances() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('myflow-finances', []);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'> & { date?: number }) => {
    setTransactions([{ 
      id: generateId(), 
      date: transaction.date || Date.now(),
      ...transaction 
    }, ...transactions]);
    trackEvent('finances', 'transaction_added');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return { transactions, addTransaction, deleteTransaction };
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM
  completed: boolean;
  createdAt: number;
}

export function useReminders() {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('myflow-reminders', []);

  const addReminder = (title: string, date: string, time?: string) => {
    setReminders([{
      id: generateId(),
      title,
      date,
      time,
      completed: false,
      createdAt: Date.now()
    }, ...reminders]);
    trackEvent('calendar', 'reminder_added');
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const activeReminders = reminders.filter(r => !r.completed).sort((a, b) => {
    // Sort by date then time
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  return { reminders, activeReminders, addReminder, toggleReminder, deleteReminder };
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  times: string[]; // HH:MM, sorted
  createdAt: number;
}

export interface MedicationLogEntry {
  medId: string;
  time: string; // HH:MM scheduled time
  date: string; // ISO date string YYYY-MM-DD
}

export function useMedications() {
  const [medications, setMedications] = useLocalStorage<Medication[]>('myflow-medications', []);
  const [log, setLog] = useLocalStorage<MedicationLogEntry[]>('myflow-medication-log', []);

  const getTodayDateString = () => new Date().toISOString().split('T')[0] as string;

  const addMedication = (name: string, times: string[], dosage?: string) => {
    setMedications([
      { id: generateId(), name, dosage, times: [...times].sort(), createdAt: Date.now() },
      ...medications,
    ]);
  };

  const deleteMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    setLog(log.filter(l => l.medId !== id));
  };

  const isTaken = (medId: string, time: string, date: string = getTodayDateString()) =>
    log.some(l => l.medId === medId && l.time === time && l.date === date);

  const toggleTaken = (medId: string, time: string) => {
    const date = getTodayDateString();
    if (isTaken(medId, time, date)) {
      setLog(log.filter(l => !(l.medId === medId && l.time === time && l.date === date)));
    } else {
      setLog([...log, { medId, time, date }]);
      trackEvent('medicin', 'dose_taken');
    }
  };

  return { medications, addMedication, deleteMedication, isTaken, toggleTaken, log };
}

export interface DumpIdea {
  id: string;
  text: string;
  createdAt: number;
}

export function useDumpIdeas() {
  const [ideas, setIdeas] = useLocalStorage<DumpIdea[]>('myflow-dump-ideas', []);

  const addIdea = (text: string) => {
    setIdeas([{ id: generateId(), text, createdAt: Date.now() }, ...ideas]);
    trackEvent('dump', 'idea_saved');
  };

  const deleteIdea = (id: string) => {
    setIdeas(ideas.filter(i => i.id !== id));
  };

  return { ideas, addIdea, deleteIdea };
}

export interface SavedStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  alertEnabled: boolean;
  createdAt: number;
}

export function useSavedStores() {
  const [savedStores, setSavedStores] = useLocalStorage<SavedStore[]>('myflow-saved-stores', []);

  const addSavedStore = (name: string, lat: number, lon: number) => {
    setSavedStores((prev) => [
      { id: generateId(), name, lat, lon, alertEnabled: true, createdAt: Date.now() },
      ...prev,
    ]);
  };

  const deleteSavedStore = (id: string) => {
    setSavedStores((prev) => prev.filter(s => s.id !== id));
  };

  const setStoreAlert = (id: string, alertEnabled: boolean) => {
    setSavedStores((prev) => prev.map(s => s.id === id ? { ...s, alertEnabled } : s));
  };

  return { savedStores, addSavedStore, deleteSavedStore, setStoreAlert };
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
  const [savedTrips, setSavedTrips] = useLocalStorage<SavedTrip[]>('myflow-saved-trips', []);

  const addSavedTrip = (label: string, from: string, to: string) => {
    setSavedTrips([{ id: generateId(), label, from, to, createdAt: Date.now() }, ...savedTrips]);
  };

  const deleteSavedTrip = (id: string) => {
    setSavedTrips(savedTrips.filter(t => t.id !== id));
  };

  const setTripAlert = (id: string, alertEnabled: boolean, alertMinutesBefore?: number) => {
    setSavedTrips(savedTrips.map(t => t.id === id
      ? { ...t, alertEnabled, alertMinutesBefore: alertMinutesBefore ?? t.alertMinutesBefore ?? 15 }
      : t));
  };

  return { savedTrips, addSavedTrip, deleteSavedTrip, setTripAlert };
}
