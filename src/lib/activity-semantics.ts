import type { Task } from "@/hooks/use-data";

/** Aktiviteter utan tid är det användaren faktiskt burit/gjort under dagen. */
export function isUntimedActivity(task: Pick<Task, "time">): boolean {
  return !task.time;
}

/** Datum är en date-only-sträng och ska aldrig tolkas som UTC-midnatt. */
export function belongsToDate(task: Pick<Task, "dueDate">, date: string): boolean {
  return task.dueDate === date;
}
