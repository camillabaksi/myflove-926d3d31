import { activityOccursOn, decodeVisualNotes, pictogramForActivity } from "@/lib/child-visual-schedule";
import { isFamilyEntry, minuteOf, type CalendarEntry } from "@/lib/visual-calendar";
import type { Child, ChildItem } from "@/hooks/use-children";
import type { ChildScheduleEntry } from "@/components/child-schedule";

export type FamilyLayerMode = "mine" | "context" | "overview";
export interface FamilyLayerPreferences {
  mode: FamilyLayerMode;
  /** null includes future profiles; [] means nobody. */
  children: string[] | null;
  presence: Record<string, boolean>;
}
export const DEFAULT_FAMILY_LAYER: FamilyLayerPreferences = { mode: "context", children: null, presence: {} };

/** Project calendar-only fields. Never carry notes, files, account links or profile observations. */
export function projectFamilyCalendar(date: string, children: Child[], items: ChildItem[], schedules: Record<string, ChildScheduleEntry[]>, owner?: string): CalendarEntry[] {
  const members = new Map(children.map(c => [c.id, { id: c.id, name: c.name }]));
  const out: CalendarEntry[] = [];
  for (const item of items) {
    if (item.kind !== "activity" || !activityOccursOn(item, date)) continue;
    const { meta } = decodeVisualNotes(item.notes);
    const mine = item.owner_id === owner;
    const member = members.get(item.child_id) ?? { id: item.child_id, name: "Delad barnaktivitet" };
    out.push({ id: `c-${item.id}`, sourceId: item.id, source: "child", date, title: item.title,
      time: item.time?.slice(0, 5) || undefined, endTime: meta.endTime ?? undefined, periodEnd: item.repeat === "daily" && !item.time ? meta.repeatUntil : undefined,
      periodStart: item.repeat === "daily" && !item.time && meta.repeatUntil ? item.date ?? undefined : undefined, location: meta.location ?? undefined, linkGroup: meta.linkGroup ?? undefined, done: false, editable: false,
      familyMembers: [member], label: member.name, href: "/barn", pictogram: pictogramForActivity(item.title, meta.pictogram),
      requiresParent: mine && meta.parentPresence === true,
      ...(mine ? { parentTaskId: meta.parentTaskId, prepMinutes: meta.prepMinutes, travelMinutes: meta.travelMinutes } : {}) });
  }
  const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
  for (const child of children) {
    // School schedules are the current owner's account store, not a linked account's data.
    if (child.owner_id !== owner) continue;
    for (const item of schedules[child.id] ?? []) {
      if (item.weekday !== weekday) continue;
      if (out.some(e => e.familyMembers?.some(m => m.id === child.id) && e.title.trim().toLocaleLowerCase("sv") === item.title.trim().toLocaleLowerCase("sv") && e.time === item.start && e.endTime === item.end && (e.location ?? "").trim().toLocaleLowerCase("sv") === (item.location ?? "").trim().toLocaleLowerCase("sv"))) continue;
      out.push({ id: `school-${child.id}-${item.id}`, sourceId: `school-${child.id}-${item.id}`, source: "child", date,
        title: item.title, time: item.start, endTime: item.end, location: item.location, done: false, editable: false,
        familyMembers: [{ id: child.id, name: child.name }], label: child.name, requiresParent: false, href: "/barn", pictogram: "school" });
    }
  }
  return out;
}

export function applyFamilyPresence(entries: CalendarEntry[], prefs: FamilyLayerPreferences): CalendarEntry[] {
  return entries.map(e => isFamilyEntry(e) ? { ...e, requiresParent: prefs.presence[e.id] ?? (e.requiresParent === true) } : e);
}
/** Group only identical calendar information with identical responsibility; preserve original IDs. */
export function familyLayerEntries(entries: CalendarEntry[], prefs: FamilyLayerPreferences): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  for (const entry of applyFamilyPresence(entries, prefs)) {
    if (!isFamilyEntry(entry)) { out.push(entry); continue; }
    if (prefs.mode === "mine") continue;
    const members = entry.familyMembers?.filter(m => prefs.children === null || prefs.children.includes(m.id));
    if (entry.source === "child" && !members?.length) continue;
    const e = { ...entry, familyMembers: members, label: members?.map(m => m.name).join(" & ") || entry.label };
    const match = out.find(o => o.source === "child" && e.source === "child" &&
      o.title.trim().toLocaleLowerCase("sv") === e.title.trim().toLocaleLowerCase("sv") &&
      o.date === e.date && o.time === e.time && o.endTime === e.endTime &&
      (!!e.time || !!e.linkGroup && e.linkGroup === o.linkGroup) &&
      (o.location ?? "").trim().toLocaleLowerCase("sv") === (e.location ?? "").trim().toLocaleLowerCase("sv") &&
      o.requiresParent === e.requiresParent && o.parentTaskId === e.parentTaskId &&
      o.prepMinutes === e.prepMinutes && o.travelMinutes === e.travelMinutes && o.pictogram === e.pictogram &&
      !o.familyMembers?.some(m => members?.some(n => n.id === m.id)));
    if (match) {
      match.familyMembers = [...(match.familyMembers ?? []), ...(members ?? [])];
      match.label = match.familyMembers.map(m => m.name).join(" & ");
    } else out.push(e);
  }
  return out;
}

/** Context informs a choice; only explicit presence reserves time. Unknown durations stay unknown. */
export function familyPlanningContext(entries: CalendarEntry[], startTime: string, endTime?: string): { context: CalendarEntry[]; presence: CalendarEntry[] } {
  const start = minuteOf(startTime), finish = minuteOf(endTime);
  if (start === null) return { context: [], presence: [] };
  const overlaps = entries.filter(e => {
    if (!isFamilyEntry(e)) return false;
    const s = minuteOf(e.time), end = minuteOf(e.endTime);
    if (s === null) return false;
    const buffered = s - (e.requiresParent ? (e.prepMinutes ?? 0) + (e.travelMinutes ?? 0) : 0);
    if (finish === null || finish <= start) return buffered === start || (end !== null && buffered <= start && end > start);
    return end !== null && end > s ? buffered < finish && end > start : buffered >= start && buffered <= finish;
  });
  return { context: overlaps.filter(e => !e.requiresParent), presence: overlaps.filter(e => e.requiresParent) };
}
