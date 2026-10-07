import type { Task, Reminder } from "@/hooks/use-data";
import { occursOn, routineOccursOn, type Routine } from "@/lib/recurrence";
import type { Lecture } from "@/lib/study-calendar";
import type { QuickflowItem } from "@/lib/quickflow";
import type { PriorityTask } from "@/lib/quickflow-priority";
import { todayISO, completedBelongsToDay } from "@/lib/flow-items";

export type CalendarView = "manad" | "vecka" | "dag";
export type CalendarSource = "task" | "reminder" | "routine" | "study" | "quickflow" | "priority" | "family" | "child" | "external";
export interface CalendarEntry {
  id: string;
  sourceId: string;
  source: CalendarSource;
  date: string;
  title: string;
  time?: string;
  endTime?: string;
  energyImpact?: Task["energyImpact"];
  friction?: Task["friction"];
  done: boolean;
  editable: boolean;
  area?: string;
  recurring?: boolean;
  href?: string;
  label?: string;
}
export function calendarDate(date: Date): string { return todayISO(date); }
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return calendarDate(d);
}
export function periodDates(date: string, view: CalendarView): string[] {
  const d = new Date(`${date}T12:00:00`);
  if (view === "dag") return [date];
  if (view === "vecka") {
    const start = shiftDate(date, -((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  }
  d.setDate(1);
  const start = shiftDate(calendarDate(d), -((d.getDay() + 6) % 7));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  const count = Math.ceil((((d.getDay() + 6) % 7) + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, i) => shiftDate(start, i));
}
export function minuteOf(time?: string): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h < 24 && m < 60 ? h * 60 + m : null;
}
export function timeOf(minute: number): string {
  const n = Math.max(0, Math.min(1439, Math.round(minute)));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
export interface CalendarSources {
  tasks: Task[];
  reminders: Reminder[];
  routines: Routine[];
  lectures: Lecture[];
  quickflow: QuickflowItem[];
  priority: PriorityTask[];
}
/** Read-only projection; original IDs and stores remain the mutation boundary. */
export function projectCalendar(dates: string[], data: CalendarSources, today = todayISO()): Record<string, CalendarEntry[]> {
  const days: Record<string, CalendarEntry[]> = Object.fromEntries(dates.map(d => [d, []]));
  const linked = new Set(data.tasks.map(t => t.quickflowId).filter(Boolean));
  for (const date of dates) {
    const out = days[date];
    if (!out) continue;
    for (const task of data.tasks) {
      if (task.snoozedUntil && task.snoozedUntil > date) continue;
      const belongs = task.completed
        ? completedBelongsToDay(date, task.dueDate, task.completedAt)
        : task.dueDate === date || (date === today && (!task.dueDate || task.dueDate < today));
      if (!belongs) continue;
      out.push({ id: `task-${task.id}`, sourceId: task.id, source: "task", date, title: task.title,
        time: task.dueDate && task.dueDate < date ? undefined : task.time,
        endTime: task.dueDate && task.dueDate < date ? undefined : task.endTime,
        energyImpact: task.energyImpact, friction: task.friction, area: task.area, done: task.completed, editable: !task.syncKey,
        href: task.syncKey ? "/studyflow" : undefined,
        label: task.dueDate && task.dueDate < date ? "Tidigare planerad" : task.quickflowId ? "QuickFlow" : undefined });
    }
    for (const r of data.reminders) {
      if (r.canceled || !(occursOn(r.date, r.repeat, date) || (r.endDate && date >= r.date && date <= r.endDate))) continue;
      const middle = !!r.endDate && r.date !== date;
      out.push({ id: `rem-${r.id}`, sourceId: r.id, source: "reminder", date, title: r.title,
        time: middle ? undefined : r.time, endTime: middle ? undefined : r.endTime,
        energyImpact: r.energyImpact, area: r.area, done: r.completed && (r.repeat ?? "none") === "none", editable: true,
        recurring: (r.repeat ?? "none") !== "none" || !!r.endDate });
    }
    for (const r of data.routines) if (r.enabled && routineOccursOn(r, date)) {
      out.push({ id: `routine-${r.id}`, sourceId: r.id, source: "routine", date, title: r.title,
        time: r.time || undefined, done: false, editable: false, href: "/rutiner", label: "Rutin" });
    }
    const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
    for (const l of data.lectures) {
      if (l.weekday !== weekday || data.tasks.some(t => t.syncKey === `studyflow:lecture:${l.id}:${date}`)) continue;
      out.push({ id: `lec-${l.id}`, sourceId: l.id, source: "study", date, title: l.title,
        time: l.start, endTime: l.end, done: false, editable: false, href: "/studyflow", label: l.kind === "break" ? "Rast" : l.kind === "lunch" ? "Lunch" : "Studier" });
    }
    for (const q of data.quickflow) {
      if (linked.has(q.id)) continue;
      const planned = q.remindAt ? calendarDate(new Date(q.remindAt)) : undefined;
      if (q.done ? !completedBelongsToDay(date, planned, q.doneAt) : planned ? planned !== date : date !== today) continue;
      const time = q.remindAt ? timeOf(new Date(q.remindAt).getHours() * 60 + new Date(q.remindAt).getMinutes()) : undefined;
      out.push({ id: `qf-${q.id}`, sourceId: q.id, source: "quickflow", date, title: q.text, time,
        area: q.area, done: !!q.done, editable: false, href: "/quickflow", label: "QuickFlow" });
    }
    if (date === today) for (const p of data.priority) {
      if (linked.has(p.id) || p.done && !completedBelongsToDay(date, undefined, p.doneAt)) continue;
      out.push({ id: `prio-${p.id}`, sourceId: p.id, source: "priority", date, title: p.title, done: !!p.done,
        editable: false, href: "/quickflow", label: "QuickFlow" });
    }
  }
  return days;
}
export interface CalendarGap { start: number; end: number; minutes: number }
/** Only claim gaps after known end times; unknown durations are not guessed. */
export function calendarGaps(items: CalendarEntry[]): CalendarGap[] {
  const timed = items.filter(i => minuteOf(i.time) !== null).sort((a, b) => (minuteOf(a.time) ?? 0) - (minuteOf(b.time) ?? 0));
  const gaps: CalendarGap[] = [];
  let end: number | null = null;
  let uncertain = false;
  for (const item of timed) {
    const start = minuteOf(item.time);
    const itemEnd = minuteOf(item.endTime);
    if (start === null) continue;
    if (!uncertain && end !== null && start - end >= 20) gaps.push({ start: end, end: start, minutes: start - end });
    if (itemEnd === null || itemEnd <= start) uncertain = true;
    end = itemEnd !== null && itemEnd > start ? Math.max(end ?? 0, itemEnd) : null;
  }
  return gaps;
}
export function calendarLoad(items: CalendarEntry[]): { label: string; segments: number; unknown: number } {
  const open = items.filter(i => !i.done);
  const known = open.filter(i => i.energyImpact && i.energyImpact !== "unknown");
  const unknown = open.length - known.length;
  const drains = known.filter(i => i.energyImpact === "drains" || i.energyImpact === "both");
  const weight = drains.reduce((n, i) => n + (i.friction === "large" ? 3 : i.friction === "small" ? 1 : 2), 0);
  if (!open.length) return { label: "Inget planerat", segments: 0, unknown: 0 };
  if (!known.length) return { label: "Inte uppskattad", segments: 0, unknown };
  const segments = weight >= 10 ? 4 : weight >= 6 ? 3 : weight >= 3 ? 2 : 1;
  return { label: ["", "Låg", "Lagom", "Ganska hög", "Hög"][segments] ?? "Inte uppskattad", segments, unknown };
}
/** Greedy lanes with connected overlap groups; geometry never grants edit permission. */
export function layoutCalendar(items: CalendarEntry[]): Array<{ item: CalendarEntry; start: number; end: number; lane: number; lanes: number }> {
  const sorted = items.flatMap(item => {
    const start = minuteOf(item.time);
    if (start === null) return [];
    const finish = minuteOf(item.endTime);
    // Visual minimum for readable touch targets, not an asserted duration.
    return [{ item, start, end: Math.max(start + 32, finish !== null && finish > start ? finish : start), lane: 0, lanes: 1 }];
  }).sort((a, b) => a.start - b.start || b.end - a.end);
  let group: typeof sorted = [];
  let groupEnd = -1;
  const flush = () => {
    const ends: number[] = [];
    for (const block of group) {
      let lane = ends.findIndex(end => end <= block.start);
      if (lane < 0) lane = ends.length;
      block.lane = lane; ends[lane] = block.end;
    }
    for (const block of group) block.lanes = ends.length;
  };
  for (const block of sorted) {
    if (block.start >= groupEnd) { flush(); group = []; groupEnd = -1; }
    group.push(block); groupEnd = Math.max(groupEnd, block.end);
  }
  flush(); return sorted;
}

/** Connected overlap groups retain every item, including transitive overlaps. */
export function calendarClusters(blocks: ReturnType<typeof layoutCalendar>) {
  const groups: Array<{ start: number; end: number; blocks: typeof blocks }> = [];
  for (const block of blocks) {
    const last = groups.at(-1);
    if (last && block.start < last.end) {
      last.blocks.push(block);
      last.end = Math.max(last.end, block.end);
    } else groups.push({ start: block.start, end: block.end, blocks: [block] });
  }
  return groups;
}