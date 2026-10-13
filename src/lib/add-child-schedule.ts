import type { Child, ChildItem } from "@/hooks/use-children";
import { activityDedupKey, activityOccursOn, type ChildRepeatMode } from "@/lib/child-visual-schedule";

export interface ChildScheduleInput {
  childId: string;
  kind: "activity";
  title: string;
  date: string;
  time?: string;
  notes?: string;
  repeat?: ChildRepeatMode;
  filePath?: string;
}

/** Same authorized child store, one independent activity per selected child. */
export async function addToChildSchedules({ owner, children, selectedIds, items, input, addItem, canContinue, fileForChild }: {
  owner: string;
  children: Child[];
  selectedIds: string[];
  items: ChildItem[];
  input: Omit<ChildScheduleInput, "childId" | "kind">;
  addItem: (input: ChildScheduleInput) => Promise<string>;
  canContinue: () => boolean | Promise<boolean>;
  fileForChild?: (id: string) => Promise<string | undefined>;
}) {
  const ids = [...new Set(selectedIds)];
  const owned = new Set(children.filter(child => child.owner_id === owner).map(child => child.id));
  const day = new Date(`${input.date}T12:00:00Z`);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.date) && Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === input.date;
  if (!owner || !ids.length || ids.some(id => !owned.has(id)) || !input.title.trim() || !validDate || input.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) throw new Error("Kontrollera aktivitet, dag och valda barn.");
  const existing = new Set(items.filter(item => (item.kind === "activity" || item.kind === "task") && item.owner_id === owner && activityOccursOn(item, input.date)).map(item => activityDedupKey({ childId: item.child_id, title: item.title, date: input.date, time: item.time })));
  const created: string[] = [], skipped: string[] = [], failed: string[] = [];
  for (const [index, childId] of ids.entries()) {
    if (!await canContinue()) { failed.push(...ids.slice(index)); break; }
    const key = activityDedupKey({ childId, title: input.title, date: input.date, time: input.time });
    if (existing.has(key)) { skipped.push(childId); continue; }
    try {
      const filePath = fileForChild ? await fileForChild(childId) : input.filePath;
      if (!await canContinue()) { failed.push(...ids.slice(index)); break; }
      await addItem({ ...input, title: input.title.trim(), childId, kind: "activity", ...(filePath ? { filePath } : {}) });
      existing.add(key);
      created.push(childId);
    } catch { failed.push(childId); }
  }
  return { created, skipped, failed };
}
