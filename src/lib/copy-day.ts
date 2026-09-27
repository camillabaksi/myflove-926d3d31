// Kopiera en egen dag till en eller flera andra dagar.
// Rena funktioner så att dubblettskyddet går att testa. Avklarade, avbokade,
// återkommande och flerdagarsposter kopieras inte – de hör redan till flera dagar
// eller är klara.
import type { Reminder, Task } from "@/hooks/use-data";

const newId = () => Math.random().toString(36).slice(2, 11);
const key = (title: string, time?: string) => `${title.trim().toLowerCase()}|${time ?? ""}`;

export function copyableTasks(tasks: Task[], sourceDate: string): Task[] {
  return tasks.filter((t) => t.dueDate === sourceDate && !t.completed);
}

export function copyableReminders(reminders: Reminder[], sourceDate: string): Reminder[] {
  return reminders.filter(
    (r) =>
      r.date === sourceDate &&
      !r.completed &&
      !r.canceled &&
      (!r.repeat || r.repeat === "none") &&
      !r.endDate,
  );
}

export function buildTaskCopies(existing: Task[], source: Task[], targetDates: string[]): Task[] {
  const out: Task[] = [];
  for (const date of targetDates) {
    const taken = new Set(existing.filter((t) => t.dueDate === date).map((t) => key(t.title, t.time)));
    for (const t of source) {
      const k = key(t.title, t.time);
      if (taken.has(k)) continue;
      taken.add(k);
      out.push({
        id: newId(),
        title: t.title,
        completed: false,
        createdAt: Date.now(),
        dueDate: date,
        time: t.time,
        endTime: t.endTime,
        reminderMinutesBefore: t.reminderMinutesBefore,
        kind: t.kind,
        note: t.note,
        area: t.area,
        energyImpact: t.energyImpact,
        friction: t.friction,
        courseId: t.courseId,
        steps: t.steps?.map((s) => ({ id: newId(), title: s.title, done: false, when: s.when })),
      });
    }
  }
  return out;
}

export function buildReminderCopies(
  existing: Reminder[],
  source: Reminder[],
  targetDates: string[],
): Reminder[] {
  const out: Reminder[] = [];
  for (const date of targetDates) {
    const taken = new Set(existing.filter((r) => r.date === date).map((r) => key(r.title, r.time)));
    for (const r of source) {
      const k = key(r.title, r.time);
      if (taken.has(k)) continue;
      taken.add(k);
      out.push({
        id: newId(),
        title: r.title,
        date,
        time: r.time,
        endTime: r.endTime,
        completed: false,
        createdAt: Date.now(),
        repeat: "none",
        remindMinutesBefore: r.remindMinutesBefore,
        note: r.note,
        area: r.area,
      });
    }
  }
  return out;
}
