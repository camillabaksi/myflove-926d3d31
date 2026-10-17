import type { Task } from "@/hooks/use-data";
import type { LifeArea } from "@/lib/life-areas";
import { activityPresetForTitle, encodeVisualNotes } from "@/lib/child-visual-schedule";

export type PlanningPeriod = "today" | "tomorrow" | "week";
export interface PlanningDraft {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  /** Inclusive end date for an untimed continuous period. */
  endDate?: string;
  location: string;
  childIds: string[];
  childItemIds: Record<string, string>;
}
export const validPlanDate = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(d.getTime()) &&
    d.toISOString().slice(0, 10) === date
  );
};
const validTime = (time: string) => !time || /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
export function validatePlanningDrafts(rows: PlanningDraft[]) {
  if (!rows.length || rows.length > 50 || new Set(rows.map((row) => row.id)).size !== rows.length)
    throw Error("Välj mellan 1 och 50 aktiviteter.");
  for (const row of rows) {
    if (
      !row.title.trim() ||
      row.title.trim().length > 240 ||
      !validPlanDate(row.date) ||
      !validTime(row.time) ||
      !validTime(row.endTime) ||
      (row.endDate !== undefined && (!validPlanDate(row.endDate) || row.endDate < row.date || !!row.time || !!row.endTime)) ||
      row.location.length > 160
    )
      throw Error("Kontrollera aktivitet, datum, tid och plats.");
    if (row.endTime && (!row.time || row.endTime <= row.time))
      throw Error("Sluttiden måste vara efter starttiden samma dag.");
  }
}
/** Preserve each reviewed row's dates/recipients when adding more lines; no inferred schedule. */
export function draftPlanningLines(
  text: string,
  date: string,
  childIds: string[],
  previous: PlanningDraft[] = [],
  uuid: () => string = () => crypto.randomUUID(),
): PlanningDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length || lines.length > 50 || lines.some((line) => line.length > 240))
    throw Error("Skriv 1–50 aktiviteter, högst 240 tecken per rad.");
  const used = new Set<string>();
  return lines.map((title) => {
    const prior = previous.find((row) => row.title === title && !used.has(row.id));
    if (prior) {
      used.add(prior.id);
      return prior;
    }
    return {
      id: uuid(),
      title,
      date,
      time: "",
      endTime: "",
      endDate: undefined,
      location: "",
      childIds: [...childIds],
      childItemIds: Object.fromEntries(childIds.map((id) => [id, uuid()])),
    };
  });
}
export function planningTasks(
  rows: PlanningDraft[],
  area: LifeArea = "vardag",
  now = Date.now(),
): Task[] {
  validatePlanningDrafts(rows);
  return rows.filter(row => !row.endDate).map((row) => ({
    id: row.id,
    title: row.title.trim(),
    dueDate: row.date,
    time: row.time || undefined,
    endTime: row.endTime || undefined,
    location: row.location.trim() || undefined,
    completed: false,
    createdAt: now,
    kind: "uppgift",
    status: "pagar",
    area,
    energyImpact: "unknown",
  }));
}
/** Idempotent append through the shared task store; never overwrite an existing activity. */
export function appendPlanningTasks(current: Task[], rows: Task[]): Task[] {
  const existing = new Map(current.map((task) => [task.id, task]));
  const signature = (task: Task) =>
    JSON.stringify([
      task.title,
      task.dueDate,
      task.time || "",
      task.endTime || "",
      task.location || "",
    ]);
  if (
    rows.some(
      (task) => existing.has(task.id) && signature(existing.get(task.id)!) !== signature(task),
    )
  )
    throw Error("En aktivitet har ändrats. Kontrollera planen innan du fortsätter.");
  return [...rows.filter((task) => !existing.has(task.id)), ...current];
}
export function childPlanningRows(rows: PlanningDraft[], owner: string, allowedChildren: string[]) {
  validatePlanningDrafts(rows);
  const allowed = new Set(allowedChildren);
  if (
    !owner ||
    rows.some(
      (row) =>
        !row.childIds.length ||
        row.childIds.some((id) => !allowed.has(id) || !row.childItemIds[id]),
    )
  )
    throw Error("Välj minst ett av dina barn för varje aktivitet.");
  const result = rows.flatMap((row) => {
    const preset = activityPresetForTitle(row.title);
    const notes = encodeVisualNotes({
      pictogram: preset?.pictogram ?? "calendar",
      category: preset?.category ?? "familj",
      tone: preset?.tone ?? "lavender",
      linkGroup: row.id,
      ...(row.endTime ? { endTime: row.endTime } : {}),
      ...(row.endDate ? { repeatUntil: row.endDate } : {}),
      ...(row.location.trim() ? { location: row.location.trim() } : {}),
    });
    return [...new Set(row.childIds)].map((childId) => ({
      id: row.childItemIds[childId]!,
      owner_id: owner,
      child_id: childId,
      kind: "activity" as const,
      title: row.title.trim(),
      date: row.date,
      time: row.time || null,
      notes,
      repeat: row.endDate ? "daily" as const : "none" as const,
      completed: false,
      remind: false,
      share_family: false,
    }));
  });
  if (new Set(result.map((row) => row.id)).size !== result.length)
    throw Error("Aktiviteterna behöver olika id:n. Öppna planeringen igen.");
  if (result.length > 100) throw Error("Välj högst 100 barnaktiviteter åt gången.");
  return result;
}
