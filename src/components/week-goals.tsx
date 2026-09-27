import { useMemo, useState } from "react";
import { CalendarPlus, Check, Plus, Target, Trash2 } from "lucide-react";
import { useCloudSyncedStorage } from "@/hooks/use-cloud-synced-storage";
import { useTasks } from "@/hooks/use-data";
import { addDaysISO, parseISODate, todayISO } from "@/lib/day";
import { isoWeekNumber } from "@/lib/iso-week";

export interface WeekGoal {
  id: string;
  title: string;
  /** "2026-W39" */
  week: string;
  createdAt: number;
  done?: boolean;
  /** Dagen man valt att göra det på (skapar en vanlig uppgift). */
  scheduledDate?: string;
  taskId?: string;
}

export const WEEK_GOALS_KEY = "myflove-week-goals";

export function weekKey(d: Date = new Date()): string {
  const n = isoWeekNumber(d);
  // ISO-året kan skilja sig kring nyår – torsdagen i veckan avgör.
  const thu = new Date(d);
  thu.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return `${thu.getFullYear()}-W${String(n).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

/** Resterande dagar i veckan (idag → söndag). */
function remainingDays(): string[] {
  const today = todayISO();
  const dow = (parseISODate(today).getDay() + 6) % 7; // mån=0
  return Array.from({ length: 7 - dow }, (_, i) => addDaysISO(today, i));
}

function dayLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Idag";
  if (iso === addDaysISO(today, 1)) return "Imorgon";
  return DAY_NAMES[parseISODate(iso).getDay()] ?? iso;
}

/**
 * Veckomål – saker som ska bli gjorda någon gång i veckan, utan fast dag.
 * Ingen röd "försenad"-markering: målet ligger kvar i veckan tills du väljer
 * en dag (då blir det en vanlig uppgift i Min dag/kalendern) eller bockar av.
 */
export function WeekGoals() {
  const [goals, setGoals] = useCloudSyncedStorage<WeekGoal[]>(WEEK_GOALS_KEY, []);
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [text, setText] = useState("");
  const [picking, setPicking] = useState<string | null>(null);
  const week = weekKey();
  const days = useMemo(remainingDays, []);

  const list = (goals ?? []).filter((g) => g.week === week);
  const isDone = (g: WeekGoal) =>
    g.taskId ? (tasks.find((t) => t.id === g.taskId)?.completed ?? !!g.done) : !!g.done;
  const doneCount = list.filter(isDone).length;

  const update = (id: string, patch: Partial<WeekGoal>) =>
    setGoals((prev) => (prev ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const add = () => {
    const title = text.trim().slice(0, 200);
    if (!title) return;
    setGoals((prev) => [
      ...(prev ?? []),
      { id: `wg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, week, createdAt: Date.now() },
    ]);
    setText("");
  };

  const schedule = (g: WeekGoal, date: string) => {
    if (g.taskId && tasks.some((t) => t.id === g.taskId)) {
      updateTask(g.taskId, { dueDate: date });
      update(g.id, { scheduledDate: date });
    } else {
      const taskId = `task-wg-${g.id}`;
      addTask(g.title, date, { id: taskId, note: "Veckomål" });
      update(g.id, { scheduledDate: date, taskId });
    }
    setPicking(null);
  };

  const toggle = (g: WeekGoal) => {
    const next = !isDone(g);
    if (g.taskId && tasks.some((t) => t.id === g.taskId)) {
      updateTask(g.taskId, {
        completed: next,
        completedAt: next ? Date.now() : undefined,
        status: next ? "klart" : "pagar",
      });
    }
    update(g.id, { done: next });
  };

  const remove = (g: WeekGoal) => {
    if (g.taskId && tasks.some((t) => t.id === g.taskId && !t.completed)) deleteTask(g.taskId);
    setGoals((prev) => (prev ?? []).filter((x) => x.id !== g.id));
  };

  return (
    <section
      data-testid="week-goals"
      className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Target size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink">
            Veckans mål · v.{week.split("-W")[1]}
          </h2>
          <p className="text-sm text-muted-foreground">
            Saker som ska bli gjorda någon gång i veckan. Välj en dag när det passar – ingen stress.
          </p>
        </div>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="T.ex. Dammsuga, fylla i barnens papper"
          aria-label="Nytt veckomål"
          className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm"
        />
        <button
          type="submit"
          aria-label="Lägg till veckomål"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"
        >
          <Plus size={20} aria-hidden />
        </button>
      </form>

      {list.length > 0 && (
        <>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {doneCount} av {list.length} klara
          </p>
          <ul className="mt-2 space-y-2">
            {list.map((g) => {
              const done = isDone(g);
              return (
                <li key={g.id} className="rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(g)}
                      aria-label={done ? "Markera som inte klar" : "Markera som klar"}
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                        done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}
                    >
                      {done && <Check size={16} aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-ink"}`}>
                        {g.title}
                      </p>
                      {g.scheduledDate && !done && (
                        <p className="text-xs text-muted-foreground">Planerad: {dayLabel(g.scheduledDate)}</p>
                      )}
                    </div>
                    {!done && (
                      <button
                        type="button"
                        onClick={() => setPicking(picking === g.id ? null : g.id)}
                        aria-label="Välj dag"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary hover:bg-primary/10"
                      >
                        <CalendarPlus size={18} aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(g)}
                      aria-label="Ta bort veckomål"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                  {picking === g.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {days.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => schedule(g, d)}
                          className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium ${
                            g.scheduledDate === d
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-ink"
                          }`}
                        >
                          {dayLabel(d)}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default WeekGoals;
