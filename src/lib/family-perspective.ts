/**
 * Min dag, barnets dag och Familj – samma data, olika perspektiv.
 *
 * Ren logik. Ingen lagring, inga energivärden. Kopplingar läses från det
 * befintliga metadata-kuvertet på barnaktiviteterna (linkGroup/parentTaskId).
 */
import type { ChildEvent } from "@/hooks/use-child-events";

export const ME_ID = "me";

export interface TimelineEntry {
  /** Unikt id för posten, t.ex. task-123 eller childitem-abc. */
  key: string;
  personId: string;
  time: string;
  endTime?: string;
  title: string;
  linkGroup?: string;
  /** Förälderns uppgift som barnaktiviteten är kopplad till. */
  parentTaskId?: string;
  /** Id på barnaktiviteten (child_items) när den finns. */
  itemId?: string;
  /** Id på förälderns uppgift när posten är förälderns egen. */
  taskId?: string;
  completed?: boolean;
  /** Originalposter bakom en enda visad hållpunkt. Ingen lagrad sammanslagning. */
  sources?: TimelineEntry[];
}

export interface TimelineCell {
  key: string;
  title: string;
  time: string;
  personIds: string[];
  entries: TimelineEntry[];
  /** Kopplad via linkGroup/parentTaskId (inte bara samma titel). */
  linked: boolean;
}

export interface TimelineRow {
  time: string;
  cells: TimelineCell[];
}

export function normalizeTitle(title: string): string {
  return title.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim();
}

export function entrySources(entry: TimelineEntry): TimelineEntry[] {
  return entry.sources ?? [entry];
}

/** En hållpunkt per barn, tid, titel och sluttid. Behåll varje original för åtgärder/kopplingar. */
export function uniqueChildEntries(entries: TimelineEntry[]): TimelineEntry[] {
  const groups = new Map<string, TimelineEntry[]>();
  for (const entry of entries.flatMap(entrySources)) {
    // Untimed activities can be separate instructions; owned parent tasks stay independent.
    const key = entry.personId === ME_ID || !entry.time
      ? JSON.stringify(["id", entry.key])
      : JSON.stringify([entry.personId, entry.itemId ? "activity" : "school", entry.time.slice(0, 5), entry.endTime ?? "", normalizeTitle(entry.title)]);
    const group = groups.get(key) ?? [];
    if (!group.some(source => source.key === entry.key)) group.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => {
    // Keep the representative stable across reload ordering. School and child_items stay separate.
    const sorted = [...group].sort((a, b) => a.key.localeCompare(b.key));
    const first = sorted[0]!;
    return sorted.length > 1 ? { ...first, sources: sorted } : first;
  });
}

function areLinked(a: TimelineEntry, b: TimelineEntry): boolean {
  return entrySources(a).some(left => entrySources(b).some(right =>
    (!!left.linkGroup && left.linkGroup === right.linkGroup) ||
    (!!left.parentTaskId && (left.parentTaskId === right.taskId || left.parentTaskId === right.parentTaskId)) ||
    (!!right.parentTaskId && right.parentTaskId === left.taskId),
  ));
}

/** Barnaktiviteter som hör hemma i Min dag: kräver mig och saknar redan en egen kopplad uppgift. */
export function childEventsForMyDay(events: ChildEvent[], myTaskIds: Set<string>): ChildEvent[] {
  return events.filter(
    (e) => e.requiresParent === true && !(e.parentTaskId && myTaskIds.has(e.parentTaskId)),
  );
}

/** "Bella – Förskola" per förälderuppgift som barnaktiviteter pekar på. */
export function linkLabelsByTask(events: ChildEvent[]): Map<string, string> {
  const out = new Map<string, string[]>();
  for (const e of events) {
    if (!e.parentTaskId) continue;
    const list = out.get(e.parentTaskId) ?? [];
    list.push(`${e.childName} – ${e.title}`);
    out.set(e.parentTaskId, list);
  }
  return new Map([...out].map(([k, v]) => [k, v.join(", ")]));
}

/** Omvandlar barnhändelser till tidslinjeposter. */
export function entriesFromChildEvents(events: ChildEvent[]): TimelineEntry[] {
  return events.map((e) => ({
    key: e.itemId ? `childitem-${e.itemId}` : `child-${e.childId}-${e.time}-${e.title}`,
    personId: e.childId,
    time: e.time,
    ...(e.endTime ? { endTime: e.endTime } : {}),
    title: e.title,
    ...(e.linkGroup ? { linkGroup: e.linkGroup } : {}),
    ...(e.parentTaskId ? { parentTaskId: e.parentTaskId } : {}),
    ...(e.itemId ? { itemId: e.itemId } : {}),
    // Schedule completion is intentionally not projected into the parent's day.
  }));
}

/**
 * Parallell tidslinje. Poster vid samma tid slås ihop till EN cell när de är
 * kopplade (samma linkGroup / samma förälderuppgift) eller har samma titel –
 * så gemensamma aktiviteter inte visas som dubbletter.
 */
export function buildParallelTimeline(entries: TimelineEntry[], personIds: string[]): TimelineRow[] {
  const allowed = new Set(personIds);
  const order = new Map(personIds.map((id, i) => [id, i]));
  const byTime = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    if (!allowed.has(e.personId)) continue;
    const list = byTime.get(e.time) ?? [];
    list.push(e);
    byTime.set(e.time, list);
  }

  const rows: TimelineRow[] = [];
  for (const [time, list] of [...byTime].sort((a, b) => a[0].localeCompare(b[0]))) {
    const cells: TimelineCell[] = [];
    for (const entry of list) {
      const match = cells.find((cell) =>
        cell.entries.some(
          (other) =>
            areLinked(entry, other) ||
            normalizeTitle(other.title) === normalizeTitle(entry.title),
        ),
      );
      if (match) {
        if (match.entries.some((o) => areLinked(o, entry))) match.linked = true;
        match.entries.push(entry);
        if (!match.personIds.includes(entry.personId)) match.personIds.push(entry.personId);
      } else {
        cells.push({ key: entry.key, title: entry.title, time, personIds: [entry.personId], entries: [entry], linked: false });
      }
    }
    for (const cell of cells) cell.personIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    rows.push({ time, cells });
  }
  return rows;
}

/** Alla andra poster som är kopplade till en given post (oavsett tid). */
export function linkedSiblings(entry: TimelineEntry, all: TimelineEntry[]): TimelineEntry[] {
  return all.filter(
    (o) =>
      o.key !== entry.key && areLinked(entry, o),
  );
}

/** Kopplade aktiviteter där tiden inte längre stämmer överens. */
export function hasTimeMismatch(entry: TimelineEntry, all: TimelineEntry[]): boolean {
  return linkedSiblings(entry, all).some((o) => o.time !== entry.time);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

/** Nu/Nästa för en persons poster utifrån faktisk tid. */
export function nowNextFor(entries: TimelineEntry[], nowMinutes: number): { now: string | null; next: string | null } {
  const sorted = [...entries].filter((e) => /^([01]\d|2[0-3]):[0-5]\d/.test(e.time) && (e.personId !== ME_ID || !e.completed)).sort((a, b) => a.time.localeCompare(b.time));
  let now: string | null = null;
  let next: string | null = null;
  sorted.forEach((e, i) => {
    const start = toMinutes(e.time);
    const following = sorted[i + 1];
    const end = e.endTime ? toMinutes(e.endTime) : following ? toMinutes(following.time) : e.personId === ME_ID ? start + 45 : 1440;
    if (start <= nowMinutes && nowMinutes < end) now = e.key;
    if (!next && start > nowMinutes) next = e.key;
  });
  return { now, next };
}
