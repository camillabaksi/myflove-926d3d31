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
const norm = (value: string | undefined) => (value ?? "").trim().toLocaleLowerCase("sv");

/**
 * Presentation-only grouping of child activities. Source rows, IDs, sync and
 * ownership are untouched; each group keeps every original entry id via
 * familyMembers/memberTimes so edits still target one child's own activity.
 *
 * Safe merges:
 * - Same child, same occurrence (title/time/end/location): show once.
 * - Different children, same day, same normalized title, same time: one row
 *   with all names. "Behöver mig" is kept if ANY copy requires it.
 * - Different children, same day, same normalized title, different times:
 *   one compact group under the earliest time with per-person times in
 *   memberTimes, so no time information is lost.
 * Never merged: different locations, periods, untimed rows without an
 * explicit link, entries sharing a child, or conflicting parent-task links.
 */
export function familyLayerEntries(entries: CalendarEntry[], prefs: FamilyLayerPreferences): CalendarEntry[] {
  const out: CalendarEntry[] = [];
  for (const entry of applyFamilyPresence(entries, prefs)) {
    if (!isFamilyEntry(entry)) { out.push(entry); continue; }
    if (prefs.mode === "mine") continue;
    const members = entry.familyMembers?.filter(m => prefs.children === null || prefs.children.includes(m.id));
    if (entry.source === "child" && !members?.length) continue;
    const e = { ...entry, familyMembers: members, label: members?.map(m => m.name).join(" & ") || entry.label };
    if (e.source !== "child") { out.push(e); continue; }

    const match = out.find(o => o.source === "child" &&
      o.date === e.date &&
      norm(o.title) === norm(e.title) &&
      norm(o.location) === norm(e.location) &&
      o.pictogram === e.pictogram &&
      !o.periodEnd && !e.periodEnd &&
      !o.familyMembers?.some(m => members?.some(n => n.id === m.id)) &&
      (o.parentTaskId ?? null) === (e.parentTaskId ?? null) &&
      (
        // Identical time: one shared row.
        (o.time === e.time && o.endTime === e.endTime && (!!e.time || !!e.linkGroup && e.linkGroup === o.linkGroup)) ||
        // Same activity at different times: compact group with per-person times.
        (!!o.time && !!e.time && !o.linkGroup && !e.linkGroup)
      ));
    if (!match) { out.push(e); continue; }

    const mergedMembers = [...(match.familyMembers ?? []), ...(members ?? [])];
    match.familyMembers = mergedMembers;
    match.label = mergedMembers.map(m => m.name).join(" & ");
    if (match.time !== e.time || match.endTime !== e.endTime) {
      // Seed per-person times from the row the group started with, then add the new copy's time.
      if (!match.memberTimes) {
        match.memberTimes = (match.familyMembers ?? [])
          .filter(m => !members?.some(n => n.id === m.id))
          .map(m => ({ ...m, time: match.time!, ...(match.endTime ? { endTime: match.endTime } : {}) }));
      }
      for (const m of members ?? []) match.memberTimes.push({ ...m, time: e.time!, ...(e.endTime ? { endTime: e.endTime } : {}) });
      // Show the group at the earliest start; no shared end time when they differ.
      if ((e.time ?? "99") < (match.time ?? "99")) match.time = e.time;
      if (new Set(match.memberTimes.map(mt => mt.endTime ?? "")).size > 1) match.endTime = undefined;
    }
    if (e.requiresParent === true) {
      match.requiresParent = true;
      match.prepMinutes = match.prepMinutes ?? e.prepMinutes;
      match.travelMinutes = match.travelMinutes ?? e.travelMinutes;
    }
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
