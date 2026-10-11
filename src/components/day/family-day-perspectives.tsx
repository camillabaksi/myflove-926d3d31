import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, Check, Clock, Link2, MoreHorizontal, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ActivityPictogram } from "@/components/family/activity-pictogram";
import { FAMILY_ID, PersonAvatar, PersonSwitcher, possessive, type Person, type Perspective } from "@/components/day/person-switcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useChildEvents } from "@/hooks/use-child-events";
import { useChildren } from "@/hooks/use-children";
import { useTasks } from "@/hooks/use-data";
import { useFlowItems } from "@/hooks/use-flow-items";
import { newLinkGroup, withLinkMeta } from "@/lib/activity-links";
import { activityOccursOn, decodeVisualNotes, localNowMinutes } from "@/lib/child-visual-schedule";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import {
  buildParallelTimeline,
  entriesFromChildEvents,
  hasTimeMismatch,
  linkedSiblings,
  ME_ID,
  nowNextFor,
  type TimelineCell,
  type TimelineEntry,
} from "@/lib/family-perspective";
import { todayISO, type FlowItem } from "@/lib/flow-items";
import { areaColor } from "@/lib/life-areas";
import { cn } from "@/lib/utils";

type Dialogs =
  | { kind: "time"; entry: TimelineEntry }
  | { kind: "link"; entry: TimelineEntry }
  | null;

function useNowMinutes(): number {
  const [now, setNow] = useState(() => localNowMinutes());
  useEffect(() => {
    const id = window.setInterval(() => setNow(localNowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Min dag · barnets dag · Familj – samma befintliga data i tre perspektiv.
 * Min dag renderas av anroparen (den vanliga dagslistan).
 */
export default function FamilyDayPerspectives({
  date,
  myDay,
  defaultPerspective = ME_ID,
}: {
  date?: string;
  myDay: ReactNode;
  defaultPerspective?: Perspective;
}) {
  const dayISO = date ?? todayISO();
  const isToday = dayISO === todayISO();
  const nowMinutes = useNowMinutes();
  const { children, items: childItems, updateItem } = useChildren();
  const childEvents = useChildEvents(dayISO);
  const { today: myItems } = useFlowItems(dayISO);
  const { updateTask, toggleTask } = useTasks();

  const [perspective, setPerspective] = useState<Perspective>(defaultPerspective);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(null);

  const people: Person[] = useMemo(
    () => children.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar })),
    [children],
  );
  const everyone: Person[] = useMemo(() => [{ id: ME_ID, name: "Du" }, ...people], [people]);
  const personById = useMemo(() => new Map(everyone.map((p) => [p.id, p])), [everyone]);
  const familySelection = selected ?? everyone.map((p) => p.id);

  // Förälderns egna poster med tid (inte barnens – de kommer från barnens dag).
  const myEntries: TimelineEntry[] = useMemo(
    () =>
      myItems
        .filter((i) => i.time && i.source !== "barn")
        .map((i) => ({
          key: i.id,
          personId: ME_ID,
          time: i.time!,
          title: i.title,
          ...(i.id.startsWith("task-") ? { taskId: i.id.slice(5) } : {}),
          ...(i.done ? { completed: true } : {}),
        })),
    [myItems],
  );
  const childEntries = useMemo<TimelineEntry[]>(() => [
    ...entriesFromChildEvents(childEvents),
    ...childItems.filter(i => i.kind === "activity" && !i.time && activityOccursOn(i, dayISO)).map(i => ({ key: `childitem-${i.id}`, personId: i.child_id, time: "", title: i.title, itemId: i.id })),
  ], [childEvents, childItems, dayISO]);
  const allEntries = useMemo(() => [...myEntries, ...childEntries], [myEntries, childEntries]);
  const myItemByKey = useMemo(() => new Map(myItems.map((i) => [i.id, i])), [myItems]);
  const childItemById = useMemo(() => new Map(childItems.map((i) => [i.id, i])), [childItems]);

  const visualFor = (entry: TimelineEntry) => {
    const own = myItemByKey.get(entry.key);
    const base: FlowItem = own ?? {
      id: entry.key,
      title: entry.title,
      source: "kalender",
      area: "vardag",
      emoji: "",
      priority: "idag",
    };
    const visual = dailyActivityVisual(own ? base : { ...base, source: "uppgift" });
    const raw = entry.itemId ? childItemById.get(entry.itemId)?.notes : null;
    if (raw?.startsWith("[myflove-visual:")) {
      const { meta } = decodeVisualNotes(raw);
      return { ...visual, pictogram: meta.pictogram, tone: meta.tone };
    }
    return visual;
  };

  if (children.length === 0) return <>{myDay}</>;

  const current = perspective === FAMILY_ID ? null : personById.get(perspective);
  const heading =
    perspective === ME_ID ? "Min dag" : perspective === FAMILY_ID ? "Familjens dag" : `${possessive(current?.name ?? "Barnets")} dag`;

  // ---- Åtgärder -----------------------------------------------------------
  const saveChild = async (itemId: string, patch: { time?: string; notes?: string }) => {
    try {
      await updateItem(itemId, patch, { force: true });
    } catch {
      toast.error("Det gick inte att spara just nu. Försök igen.");
    }
  };

  const changeTime = async (entry: TimelineEntry, time: string, alsoLinked: boolean) => {
    const targets = [entry, ...(alsoLinked ? linkedSiblings(entry, allEntries) : [])];
    for (const t of targets) {
      if (t.itemId) await saveChild(t.itemId, { time });
      else if (t.taskId) updateTask(t.taskId, { time });
    }
    toast.success(targets.length > 1 ? `Tiden ändrades för ${targets.length} kopplade aktiviteter.` : "Tiden ändrades.");
    setDialog(null);
  };

  const linkTo = async (entry: TimelineEntry, target: TimelineEntry) => {
    if (!entry.itemId) return;
    const item = childItemById.get(entry.itemId);
    if (!item) return;
    if (target.taskId) {
      await saveChild(entry.itemId, { notes: withLinkMeta(item.notes, { parentTaskId: target.taskId }, item.title) });
    } else if (target.itemId) {
      const other = childItemById.get(target.itemId);
      if (!other) return;
      const group = entry.linkGroup ?? target.linkGroup ?? newLinkGroup();
      await saveChild(entry.itemId, { notes: withLinkMeta(item.notes, { linkGroup: group }, item.title) });
      await saveChild(target.itemId, { notes: withLinkMeta(other.notes, { linkGroup: group }, other.title) });
    }
    toast.success("Aktiviteterna är kopplade. Båda finns kvar som egna aktiviteter.");
    setDialog(null);
  };

  const unlink = async (entry: TimelineEntry) => {
    if (!entry.itemId) return;
    const item = childItemById.get(entry.itemId);
    if (!item) return;
    await saveChild(entry.itemId, { notes: withLinkMeta(item.notes, { linkGroup: null, parentTaskId: null }, item.title) });
    toast.success("Kopplingen är borttagen. Aktiviteterna finns kvar.");
  };

  // Only an owned parent's task can be completed; child rows are schedules.
  const toggleDone = async (entry: TimelineEntry) => {
    if (entry.personId !== ME_ID || !entry.taskId || entry.itemId) return;
    toggleTask(entry.taskId);
  };

  // ---- Rendering ----------------------------------------------------------
  const EntryMenu = ({ entry }: { entry: TimelineEntry }) => {
    const linked = linkedSiblings(entry, allEntries).length > 0;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label={`Fler val för ${entry.title}`}>
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog({ kind: "time", entry })}>
            <Clock /> Ändra tid
          </DropdownMenuItem>
          {entry.itemId && (
            <DropdownMenuItem onSelect={() => setDialog({ kind: "link", entry })}>
              <Link2 /> {linked ? "Ändra koppling" : "Koppla till…"}
            </DropdownMenuItem>
          )}
          {entry.itemId && (entry.linkGroup || entry.parentTaskId) && (
            <DropdownMenuItem onSelect={() => void unlink(entry)}>
              <Unlink /> Ta bort koppling
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const statusFor = (entry: TimelineEntry) => {
    if (!isToday) return null;
    const own = allEntries.filter((e) => e.personId === entry.personId);
    const { now, next } = nowNextFor(own, nowMinutes);
    if (now === entry.key) return "Nu";
    if (next === entry.key) return "Nästa";
    return null;
  };

  const EntryRow = ({ entry, avatars, compact }: { entry: TimelineEntry; avatars?: string[]; compact?: boolean }) => {
    const visual = visualFor(entry);
    const color = visual.colorArea ? areaColor(visual.colorArea) : undefined;
    const status = statusFor(entry);
    const linked = linkedSiblings(entry, allEntries).length > 0;
    const mismatch = linked && hasTimeMismatch(entry, allEntries);
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-card px-2.5 py-2 shadow-sm",
          entry.personId === ME_ID && entry.completed && "bg-muted/35 opacity-70",
          status === "Nu" && "ring-2 ring-primary/40",
        )}
        style={color ? { borderLeft: `4px solid ${color}` } : undefined}
      >
        {entry.personId === ME_ID && entry.taskId && !entry.itemId && (
          <Button variant="ghost" size="icon"
            type="button"
            onClick={() => void toggleDone(entry)}
            aria-pressed={!!entry.completed}
            aria-label={entry.completed ? `Ångra klar: ${entry.title}` : `Markera som klar: ${entry.title}`}
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors",
              entry.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-transparent hover:border-primary/60",
            )}
          >
            <Check size={15} strokeWidth={3} />
          </Button>
        )}
        {!compact && <span className="w-10 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">{entry.time || "Idag"}</span>}
        <ActivityPictogram id={visual.pictogram} tone={visual.tone} className={compact ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl"} iconClassName={compact ? "h-4 w-4" : "h-5 w-5"} style={color ? { color } : undefined} />
        <div className="min-w-0 flex-1">
          <p className={cn("break-words text-sm font-semibold leading-snug text-ink", entry.personId === ME_ID && entry.completed && "line-through")}>{entry.title}</p>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <span>{visual.label}</span>
            {status && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">{status}</span>}
            {linked && (
              <span className="inline-flex items-center gap-0.5"><Link2 size={10} aria-hidden /> Kopplad familjeaktivitet</span>
            )}
            {mismatch && (
              <span className="inline-flex items-center gap-0.5 text-foreground"><AlertCircle size={10} aria-hidden /> Tiden skiljer sig från kopplad aktivitet</span>
            )}
          </div>
        </div>
        {avatars && avatars.length > 0 && (
          <span className="flex shrink-0 -space-x-1.5" aria-label={avatars.map((id) => personById.get(id)?.name).join(", ")}>
            {avatars.map((id) => {
              const p = personById.get(id);
              return p ? <PersonAvatar key={id} person={p} /> : null;
            })}
          </span>
        )}
        {EntryMenu({ entry })}
      </div>
    );
  };

  const PersonDay = ({ personId }: { personId: string }) => {
    const own = allEntries.filter((e) => e.personId === personId).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    if (own.length === 0) return <p className="rounded-2xl bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">Inget med klockslag den här dagen.</p>;
    return (
      <ul className="space-y-2">
        {own.map((e) => <li key={e.key}>{EntryRow({ entry: e })}</li>)}
      </ul>
    );
  };

  const cellEntry = (cell: TimelineCell) => cell.entries[0]!;

  const FamilyView = () => {
    const order = everyone.map((p) => p.id).filter((id) => familySelection.includes(id));
    const rows = buildParallelTimeline(allEntries, order);
    const toggle = (id: string) =>
      setSelected((prev) => {
        const base = prev ?? everyone.map((p) => p.id);
        const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
        return next.length ? next : base;
      });
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vilka vill du se?">
          {everyone.map((p) => {
            const on = familySelection.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={on} onClick={() => toggle(p.id)}
                className={cn("press inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
                  on ? "border-primary/50 bg-primary/10 text-ink" : "border-border bg-card text-muted-foreground")}>
                <PersonAvatar person={p} className="h-5 w-5 text-[9px]" /> {p.name}
              </button>
            );
          })}
          <button type="button" aria-pressed={familySelection.length === everyone.length} onClick={() => setSelected(null)}
            className="press inline-flex min-h-9 items-center rounded-full border border-border bg-card px-2.5 text-xs font-semibold text-ink">
            Alla
          </button>
        </div>

        {rows.length === 0 && <p className="rounded-2xl bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">Inget med klockslag den här dagen.</p>}

        {/* Mobil: staplad parallell vy – en rad per tid, gemensamt visas en gång. */}
        <ol className="space-y-2 md:hidden">
          {rows.map((row) => (
            <li key={row.time} className="space-y-1.5">
              {row.cells.map((cell) => (
                <div key={cell.key}>{EntryRow({ entry: cellEntry(cell), avatars: cell.personIds })}</div>
              ))}
            </li>
          ))}
        </ol>

        {/* Desktop: riktiga kolumner Tid | Du | Bella | Bianca. */}
        {rows.length > 0 && (
          <div className="hidden md:block">
            <div className="grid gap-2 border-b border-border/60 pb-2 text-xs font-semibold text-muted-foreground"
              style={{ gridTemplateColumns: `3.5rem repeat(${order.length}, minmax(0, 1fr))` }}>
              <span>Tid</span>
              {order.map((id) => {
                const p = personById.get(id)!;
                return <span key={id} className="flex items-center gap-1.5"><PersonAvatar person={p} className="h-5 w-5 text-[9px]" />{p.name}</span>;
              })}
            </div>
            {rows.map((row) => (
              <div key={row.time} className="flex items-start gap-2 border-b border-border/40 py-2">
                <span className="w-14 shrink-0 pt-3 text-xs font-semibold tabular-nums text-muted-foreground">{row.time}</span>
                <div className="grid min-w-0 flex-1 items-start gap-2" style={{ gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))` }}>
                {row.cells.flatMap((cell) => {
                  const idx = cell.personIds.map((id) => order.indexOf(id)).sort((a, b) => a - b);
                  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1]! + 1);
                  if (contiguous) {
                    return [
                      <div key={cell.key} style={{ gridColumn: `${idx[0]! + 1} / span ${idx.length}` }}>
                        {EntryRow({ entry: cellEntry(cell), avatars: idx.length > 1 ? cell.personIds : undefined, compact: true })}
                      </div>,
                    ];
                  }
                  return cell.personIds.map((pid) => {
                    const e = cell.entries.find((x) => x.personId === pid) ?? cellEntry(cell);
                    return (
                      <div key={`${cell.key}-${pid}`} style={{ gridColumn: order.indexOf(pid) + 1 }}>
                        {EntryRow({ entry: e, compact: true })}
                      </div>
                    );
                  });
                })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <PersonSwitcher people={people} value={perspective} onChange={setPerspective} />
      <p className="flex items-center gap-2 text-sm font-semibold text-ink" aria-live="polite">
        {current ? <PersonAvatar person={current} /> : null}
        {heading}
      </p>
      {perspective === ME_ID ? myDay : perspective === FAMILY_ID ? FamilyView() : PersonDay({ personId: perspective })}

      <TimeDialog
        entry={dialog?.kind === "time" ? dialog.entry : null}
        siblings={dialog?.kind === "time" ? linkedSiblings(dialog.entry, allEntries) : []}
        nameOf={(id) => personById.get(id)?.name ?? ""}
        onClose={() => setDialog(null)}
        onSave={changeTime}
      />
      <LinkDialog
        entry={dialog?.kind === "link" ? dialog.entry : null}
        candidates={dialog?.kind === "link" ? allEntries.filter((e) => e.personId !== dialog.entry.personId && (e.taskId || e.itemId)) : []}
        nameOf={(id) => personById.get(id)?.name ?? ""}
        onClose={() => setDialog(null)}
        onPick={linkTo}
      />
    </div>
  );
}

function TimeDialog({
  entry,
  siblings,
  nameOf,
  onClose,
  onSave,
}: {
  entry: TimelineEntry | null;
  siblings: TimelineEntry[];
  nameOf: (id: string) => string;
  onClose: () => void;
  onSave: (entry: TimelineEntry, time: string, alsoLinked: boolean) => void;
}) {
  const [time, setTime] = useState("");
  useEffect(() => setTime(entry?.time ?? ""), [entry]);
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Ändra tid</DialogTitle>
          <DialogDescription>{entry?.title}</DialogDescription>
        </DialogHeader>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Ny tid" />
        {siblings.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Kopplad till: {siblings.map((s) => `${nameOf(s.personId)} – ${s.title}`).join(", ")}. Vill du uppdatera även dem?
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-full" disabled={!valid || !entry} onClick={() => entry && onSave(entry, time, false)}>
            {siblings.length ? "Bara denna" : "Spara"}
          </Button>
          {siblings.length > 0 && (
            <Button type="button" className="rounded-full" disabled={!valid || !entry} onClick={() => entry && onSave(entry, time, true)}>
              Uppdatera alla ({siblings.length + 1})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkDialog({
  entry,
  candidates,
  nameOf,
  onClose,
  onPick,
}: {
  entry: TimelineEntry | null;
  candidates: TimelineEntry[];
  nameOf: (id: string) => string;
  onClose: () => void;
  onPick: (entry: TimelineEntry, target: TimelineEntry) => void;
}) {
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Koppla aktivitet</DialogTitle>
          <DialogDescription>
            Båda aktiviteterna finns kvar som egna. Kopplingen är privat och delas inte med någon.
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Det finns inget annat med klockslag den här dagen att koppla till.</p>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {candidates.map((c) => (
              <li key={c.key}>
                <button type="button" onClick={() => entry && onPick(entry, c)}
                  className="press flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-left text-sm hover:bg-secondary/50">
                  <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{c.time}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{c.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.personId === ME_ID ? "Du" : nameOf(c.personId)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
