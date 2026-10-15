import type { Task } from "@/hooks/use-data";
import { capacityTone } from "@/lib/day-capacity";
import { addDaysISO } from "@/lib/day";
import { chainPos, classifyPriority, simplifyTask } from "@/lib/priority-engine";
import { pacePlanningEntries } from "@/lib/day-pace";
import { calendarGaps, minuteOf, timeOf, type CalendarEntry } from "@/lib/visual-calendar";

export type ReplanChange = {
  id: string; taskId: string; title: string; kind: "time" | "tomorrow" | "small-step";
  before: string; after: string; reason: string;
  patch: Partial<Pick<Task, "time" | "endTime" | "dueDate" | "steps">>;
};
export type ReplanInput = {
  tasks: Task[]; entries: CalendarEntry[]; date: string; nowMinutes: number;
  capacity: number | null; useCapacity: boolean; deferIds: string[]; calendarReady: boolean;
};
export const replanFingerprint = (value: unknown) => JSON.stringify(value);

/** Protect linked/generated data, explicit reminders/deadlines, care, health and bookings. */
export function protectedReplanTask(task: Task, date: string): boolean {
  return !!(task.completed || task.status === "klart" || task.status === "vantar" || task.syncKey || task.quickflowId ||
    task.courseId || task.deadlineLeadDays?.length || task.deadlineReminderTime || task.reminderMinutesBefore !== undefined ||
    (task.dueDate && task.dueDate < date) ||
    classifyPriority({ id: task.id, title: task.title, time: task.time }, date).priority === 1);
}

export function replanTasks(input: Pick<ReplanInput, "tasks" | "entries" | "date" | "nowMinutes">): Task[] {
  const own = new Set(input.entries.filter(entry => entry.date === input.date && entry.source === "task" && entry.editable && !entry.done).map(entry => entry.sourceId));
  return input.tasks.filter(task => own.has(task.id) && !protectedReplanTask(task, input.date) &&
    !input.entries.some(entry => entry.parentTaskId === task.id) &&
    (!task.dueDate || task.dueDate <= input.date) &&
    (!task.snoozedUntil || task.snoozedUntil <= input.date) &&
    (minuteOf(task.time) === null || minuteOf(task.time)! >= input.nowMinutes));
}

/** Moving a date requires a separate explicit choice; dates are never inferred as flexible. */
export function deferrableReplanTasks(input: ReplanInput): Task[] {
  const planning = pacePlanningEntries(input.entries).filter(entry => !entry.done);
  return replanTasks(input).filter(task => {
    if (classifyPriority({ id: task.id, title: task.title }, input.date).priority < 3) return false;
    const position = chainPos(task.title);
    return !position || !planning.some(entry => {
      const other = chainPos(entry.title);
      return other?.chain === position.chain && other.step > position.step;
    });
  });
}

/** Reserve explicit family presence including recorded preparation/travel, never child context. */
function planningEntries(entries: CalendarEntry[]): CalendarEntry[] {
  const planning = pacePlanningEntries(entries);
  // A linked parent's task avoids duplicate load, but must not erase the child's explicit travel/preparation reservation.
  const linkedPresence = entries.filter(entry => entry.requiresParent && entry.parentTaskId &&
    planning.some(parent => parent.source === "task" && parent.sourceId === entry.parentTaskId));
  return [...planning, ...linkedPresence].filter(entry => !entry.done).map(entry => {
    const start = minuteOf(entry.time);
    const buffer = (entry.prepMinutes ?? 0) + (entry.travelMinutes ?? 0);
    return start !== null && entry.requiresParent && buffer > 0 ? { ...entry, time: timeOf(Math.max(0, start - buffer)) } : entry;
  });
}

function overlaps(start: number, end: number, other: CalendarEntry): boolean {
  const a = minuteOf(other.time), b = minuteOf(other.endTime);
  // Unknown lengths are not guessed; at least the known start can establish a collision.
  return a !== null && (b !== null && b > a ? start < b && end > a : start <= a && end > a);
}

function preservesDependencies(task: Task, start: number, end: number, entries: CalendarEntry[]): boolean {
  const position = chainPos(task.title);
  if (!position) return true;
  return entries.every(entry => {
    const other = chainPos(entry.title);
    if (!other || other.chain !== position.chain || other.step === position.step) return true;
    // A known dependency with unknown timing cannot establish a safe new order.
    const otherStart = minuteOf(entry.time), otherEnd = minuteOf(entry.endTime);
    return other.step < position.step ? otherEnd !== null && start >= otherEnd : otherStart !== null && end <= otherStart;
  });
}

/** Deterministic preview, separate from the existing "what now" plan. No writes or energy forecast. */
export function buildDayReplan(input: ReplanInput): { changes: ReplanChange[]; unknownDurations: number; gentle: boolean } {
  const gentle = input.useCapacity && input.capacity !== null && Number.isFinite(input.capacity) && capacityTone(input.capacity) === "low";
  const changes: ReplanChange[] = [];
  const entries = planningEntries(input.entries);
  const reserved: CalendarEntry[] = [];
  const deferrable = new Set(deferrableReplanTasks(input).map(task => task.id));
  const unknownDurations = entries.filter(entry => {
    const start = minuteOf(entry.time), end = minuteOf(entry.endTime);
    return start !== null && (end === null || end <= start);
  }).length;
  for (const task of replanTasks(input)) {
    if (input.deferIds.includes(task.id) && deferrable.has(task.id)) {
      changes.push({ id: `${task.id}:tomorrow`, taskId: task.id, title: task.title, kind: "tomorrow",
        before: task.time ? `Idag ${task.time}` : "Idag", after: "Imorgon · utan tid",
        reason: "Du har valt att den får vänta. Datumet ändras; morgondagens ork bedöms inte.",
        patch: { dueDate: addDaysISO(input.date, 1), time: undefined, endTime: undefined } });
      continue;
    }
    const start = minuteOf(task.time), end = minuteOf(task.endTime);
    const other = entries.filter(entry => !(entry.source === "task" && entry.sourceId === task.id));
    if (input.calendarReady && start !== null && end !== null && end > start && other.some(entry => overlaps(start, end, entry))) {
      // Keep all original slots occupied as well as every proposed slot: any selected subset is safe.
      const occupied = [...other, ...reserved];
      const slot = calendarGaps(occupied).map(gap => ({ start: Math.max(gap.start + 15, Math.ceil(input.nowMinutes / 5) * 5), end: gap.end - 15 }))
        .find(gap => gap.start + end - start <= gap.end && preservesDependencies(task, gap.start, gap.start + end - start, occupied));
      if (slot) {
        const newEnd = slot.start + end - start;
        changes.push({ id: `${task.id}:time`, taskId: task.id, title: task.title, kind: "time", before: `${task.time}–${task.endTime}`,
          after: `${timeOf(slot.start)}–${timeOf(newEnd)}`, reason: "Undviker en tidskrock och lämnar 15 min mellan kända tider. Kontrollera att restiden räcker.",
          patch: { time: timeOf(slot.start), endTime: timeOf(newEnd) } });
        reserved.push({ id: `proposed-${task.id}`, sourceId: task.id, source: "task", date: input.date, title: task.title,
          time: timeOf(slot.start), endTime: timeOf(newEnd), editable: false, done: false });
        continue;
      }
    }
    if (gentle && !task.steps?.length && (task.friction === "large" || task.friction === "medium" || task.energyImpact === "drains")) {
      const step = simplifyTask(task.title, "mellan") ?? `Välj en liten del av ”${task.title}” att börja med.`;
      changes.push({ id: `${task.id}:small-step`, taskId: task.id, title: task.title, kind: "small-step", before: "Hela uppgiften", after: step,
        reason: "Din loggade kapacitet är låg just nu. Ett litet första steg kan vara ett alternativ; tiden och uppgiften ligger kvar.",
        patch: { steps: [{ id: `replan-${task.id}-${input.date}`, title: step, done: false }] } });
    }
  }
  return { changes, unknownDurations, gentle };
}

/** Atomic local update. Reject stale previews before changing any row, preserve all other fields. */
export function applyDayReplanChanges(current: Task[], expected: Task[], changes: ReplanChange[], date: string): Task[] {
  if (!changes.length) return current;
  if (replanFingerprint(current) !== replanFingerprint(expected)) throw new Error("Uppgifterna har ändrats. Uppdatera förslaget innan du använder det.");
  const ids = new Set<string>();
  for (const change of changes) {
    const task = current.find(item => item.id === change.taskId);
    if (!task || ids.has(task.id) || protectedReplanTask(task, date)) throw new Error("Förslaget kan inte användas längre. Uppdatera det först.");
    ids.add(task.id);
  }
  const patches = new Map(changes.map(change => [change.taskId, change.patch]));
  return current.map(task => patches.has(task.id) ? { ...task, ...patches.get(task.id) } : task);
}
