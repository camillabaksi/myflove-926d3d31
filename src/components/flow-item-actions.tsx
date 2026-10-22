import { useMemo, type ReactNode, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { ALL_AREAS, AREA_META, type LifeArea } from "@/lib/life-areas";
import type { Routine } from "@/lib/recurrence";

/**
 * Ändra eller ta bort – samma två knappar överallt i MyFlove.
 *
 * Allt du själv har lagt in ska gå att justera där du ser det, utan att
 * behöva leta upp rätt vy först. Saker som kommer från ett schema (lektioner,
 * barnens hållpunkter) ändras där de hör hemma – då visar vi vart man går.
 */

/**
 * Tre-prick-menyer ska inte poppa upp mitt i en skroll. Radix-menyer öppnar
 * normalt redan vid pek ned (som på mobil är skrollstarten), så öppningen
 * flyttas till pek upp – ett riktigt tryck utan skrollrörelse. Klick kan inte
 * användas: när pek ned avbryts blir klicket detail 0 (som tangentbordet) på
 * riktiga tappar, så vakten kunde inte skilja dem åt.
 */
export function useScrollSafeMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const pointerScrolling = useRef(false);
  const handledByPointer = useRef(false);
  const handledByKeyboard = useRef(false);
  const triggerProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      // Pek ned är ofta början på en skroll – hindra Radix från att öppna här.
      // Radix kör sina handlers efter våra och hoppar över när eventet är avbrutet.
      event.preventDefault();
      pointerStart.current = { x: event.clientX, y: event.clientY };
      pointerScrolling.current = false;
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (pointerStart.current && !pointerScrolling.current) {
        const moved = Math.abs(event.clientX - pointerStart.current.x) > 8 || Math.abs(event.clientY - pointerStart.current.y) > 8;
        if (moved) pointerScrolling.current = true;
      }
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const start = pointerStart.current;
      pointerStart.current = null;
      if (!start) return;
      if (pointerScrolling.current || Math.abs(event.clientX - start.x) > 8 || Math.abs(event.clientY - start.y) > 8) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      handledByPointer.current = true;
      setMenuOpen((v) => !v);
    },
    onPointerCancel: () => {
      // Avbruten gest (t.ex. skroll som tog över) ska aldrig öppna menyn.
      pointerStart.current = null;
      pointerScrolling.current = false;
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      // Radix öppnar själv på Enter/Blanksteg – klicket som följer ska inte växla tillbaka.
      if (event.key === "Enter" || event.key === " ") handledByKeyboard.current = true;
    },
    onClick: () => {
      // Klick utan pek- eller tangentsekvens (t.ex. hjälpmedel som aktiverar
      // programmässigt) ska öppna menyn. Vanliga tryck och tangenttryck har
      // redan hanterats och hoppar över.
      if (handledByPointer.current) {
        handledByPointer.current = false;
        return;
      }
      if (handledByKeyboard.current) {
        handledByKeyboard.current = false;
        return;
      }
      setMenuOpen((v) => !v);
    },
  };
  return { menuOpen, setMenuOpen, triggerProps };
}

export type EditableKind = "uppgift" | "kalender" | "tanke" | "quickflow" | "rutin" | "extern";

/** Vilken sorts sak ett id pekar på: "task-123", "rem-9", "qf-a1", "routine-x". */
export function kindFromId(id: string): { kind: EditableKind; realId: string } {
  if (id.startsWith("task-")) return { kind: "uppgift", realId: id.slice(5) };
  if (id.startsWith("rem-")) return { kind: "kalender", realId: id.slice(4) };
  if (id.startsWith("qf-")) return { kind: "tanke", realId: id.slice(3) };
  if (id.startsWith("prio-")) return { kind: "quickflow", realId: id.slice(5) };
  if (id.startsWith("routine-")) return { kind: "rutin", realId: id.slice(8) };
  // Kalendervyn använder kortare prefix för samma saker.
  if (id.startsWith("t-")) return { kind: "uppgift", realId: id.slice(2) };
  if (id.startsWith("r-")) return { kind: "kalender", realId: id.slice(2) };
  return { kind: "extern", realId: id };
}

const EXTERNAL_HOME: Record<string, { label: string; href: string }> = {
  "lec-": { label: "schemat i Studier", href: "/studyflow" },
  "child-": { label: "barnens schema", href: "/barn" },
  "childitem-": { label: "barnens schema", href: "/barn" },
  "c-": { label: "barnens schema", href: "/barn" },
  "f-": { label: "familjens kalender", href: "/familj" },
};

function externalHome(id: string) {
  const hit = Object.entries(EXTERNAL_HOME).find(([p]) => id.startsWith(p));
  return hit ? hit[1] : null;
}

export function FlowItemActions({
  itemId,
  className,
  size = 16,
  only,
  compact = false,
  showLabel = false,
  onSaved,
  children,
}: {
  itemId: string;
  className?: string;
  size?: number;
  /** "edit" när vyn redan har en egen ta bort-knapp. */
  only?: "edit";
  /** Samlar åtgärder i en enda meny på ytor där aktiviteten behöver mer plats. */
  compact?: boolean;
  /** Show one clearly labeled edit action in the calendar detail view. */
  showLabel?: boolean;
  /** Called only when a change or deletion succeeds, not on cancel. */
  onSaved?: () => void;
  /** Vy-specifika val som flytta/öppna, före ändra och ta bort. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { menuOpen, setMenuOpen, triggerProps } = useScrollSafeMenu();
  const { kind } = kindFromId(itemId);
  const home = externalHome(itemId);

  if (kind === "extern" && !home) return null;

  if (compact) {
    return (
      <>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={className ?? "h-9 w-9 text-muted-foreground"}
              aria-label="Fler val"
              {...triggerProps}
            >
              <MoreHorizontal size={size + 2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {children}
            {children ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              <Pencil /> Ändra
            </DropdownMenuItem>
            {kind !== "extern" && only !== "edit" && (
              <DropdownMenuItem onSelect={() => setOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 /> Ta bort
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {open && (
          <FlowItemEditDialog
            itemId={itemId}
            onClose={() => setOpen(false)}
            onSaved={onSaved}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={className ?? "flex shrink-0 items-center gap-1"}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={showLabel ? "Ändra aktivitet" : "Ändra"}
          title={showLabel ? "Ändra aktivitet" : "Ändra"}
          className={showLabel ? "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-secondary/50" : "press rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"}
        >
          <Pencil size={size} />
          {showLabel && <span>Ändra aktivitet</span>}
        </button>
        {kind !== "extern" && only !== "edit" && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ta bort"
            title="Ta bort"
            className={showLabel ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive" : "press rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"}
          >
            <Trash2 size={size} />
          </button>
        )}
      </div>
      {open && (
          <FlowItemEditDialog
            itemId={itemId}
            onClose={() => setOpen(false)}
            onSaved={onSaved}
          />
        )}
    </>
  );
}

function FlowItemEditDialog({
  itemId,
  onClose,
  onSaved,
}: {
  itemId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { kind, realId } = kindFromId(itemId);
  const { tasks, updateTask, deleteTask } = useTasks();
  const { reminders, updateReminder, deleteReminder } = useReminders();
  const { items: thoughts, update: updateThought, remove: removeThought } = useQuickflow();
  const {
    items: priorityItems,
    update: updatePriority,
    remove: removePriority,
  } = usePriorityList();
  const [routines, setRoutines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);

  const source = useMemo(() => {
    if (kind === "uppgift") return tasks.find((t) => t.id === realId) ?? null;
    if (kind === "kalender") return reminders.find((r) => r.id === realId) ?? null;
    if (kind === "tanke") return thoughts.find((t) => t.id === realId) ?? null;
    if (kind === "quickflow") return priorityItems.find((p) => p.id === realId) ?? null;
    if (kind === "rutin") return (routines ?? []).find((r) => r.id === realId) ?? null;
    return null;
  }, [kind, realId, tasks, reminders, thoughts, priorityItems, routines]);

  const initial = useMemo(() => {
    if (!source) return null;
    if (kind === "uppgift") {
      const t = source as (typeof tasks)[number];
      return {
        title: t.title,
        date: t.dueDate ?? "",
        time: t.time ?? "",
        endTime: t.endTime ?? "",
        endDate: "",
        note: t.note ?? "",
        area: (t.area ?? "vardag") as LifeArea,
      };
    }
    if (kind === "kalender") {
      const r = source as (typeof reminders)[number];
      return {
        title: r.title,
        date: r.date,
        time: r.time ?? "",
        endTime: r.endTime ?? "",
        endDate: r.endDate ?? "",
        note: r.note ?? "",
        area: "vardag" as LifeArea,
      };
    }
    if (kind === "quickflow") {
      const p = source as (typeof priorityItems)[number];
      return {
        title: p.title,
        date: "",
        time: "",
        endTime: "",
        endDate: "",
        note: "",
        area: "vardag" as LifeArea,
      };
    }
    if (kind === "tanke") {
      const q = source as (typeof thoughts)[number];
      return {
        title: q.text,
        date: "",
        time: "",
        endTime: "",
        note: "",
        area: (q.area ?? "vardag") as LifeArea,
      };
    }
    const r = source as Routine;
    return {
      title: r.title,
      date: "",
      time: r.time ?? "",
      endTime: "",
      note: "",
      area: "vardag" as LifeArea,
    };
  }, [source, kind]);

  const [form, setForm] = useState(
    initial ?? { title: "", date: "", time: "", endTime: "", endDate: "", note: "", area: "vardag" as LifeArea },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const home = externalHome(itemId);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    if ((kind === "uppgift" || kind === "kalender") && !form.date) {
      toast.error("Välj ett datum.");
      return;
    }
    if ((kind === "uppgift" || kind === "kalender") && !form.endDate && form.endTime && (!form.time || form.endTime <= form.time)) {
      toast.error("Sluttiden måste vara efter starttiden.");
      return;
    }
    if (kind === "kalender" && form.endDate && form.endDate < form.date) {
      toast.error("Slutdatum måste vara samma dag eller senare.");
      return;
    }
    if (kind === "uppgift") {
      updateTask(realId, {
        title,
        dueDate: form.date || undefined,
        time: form.time || undefined,
        endTime: form.endTime || undefined,
        note: form.note,
        area: form.area,
      });
    } else if (kind === "kalender") {
      updateReminder(realId, {
        title,
        date: form.date || undefined,
        endDate: form.endDate || undefined,
        time: form.endDate ? undefined : form.time || undefined,
        endTime: form.endDate ? undefined : form.endTime || undefined,
        note: form.note,
      });
    } else if (kind === "quickflow") {
      updatePriority(realId, { title });
    } else if (kind === "tanke") {
      updateThought(realId, { text: title, area: form.area });
    } else if (kind === "rutin") {
      setRoutines((prev) =>
        (prev ?? []).map((r) => (r.id === realId ? { ...r, title, time: form.time || r.time } : r)),
      );
    }
    toast.success("Ändringen är sparad");
    onSaved?.();
    onClose();
  };

  const remove = () => {
    // Never delete independent records based on a shared title or time.
    // A projected duplicate has the same source ID and needs only one delete.
    if (kind === "uppgift") deleteTask(realId);
    else if (kind === "kalender") deleteReminder(realId);
    else if (kind === "quickflow") removePriority(realId);
    else if (kind === "tanke") removeThought(realId);
    else if (kind === "rutin")
      setRoutines((prev) => (prev ?? []).filter((r) => r.id !== realId));
    toast.success("Borttagen", { description: "En sak mindre att hålla i huvudet. Planen får förändras." });
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {kind === "extern" ? "Ändra där den hör hemma" : "Ändra eller ta bort"}
          </DialogTitle>
          <DialogDescription>
            {kind === "extern"
              ? `Den här kommer från ${home?.label ?? "en annan del av appen"}. Ändra den där så följer den med hit.`
              : "Du bestämmer själv – ändra det du vill eller ta bort helt."}
          </DialogDescription>
        </DialogHeader>

        {kind === "extern" ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={onClose}>
              Stäng
            </Button>
            {home && (
              <Button asChild className="rounded-full">
                <a href={home.href}>Öppna</a>
              </Button>
            )}
          </div>
        ) : !source ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Den här finns inte längre.</p>
            <Button variant="ghost" className="rounded-full" onClick={onClose}>
              Stäng
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Vad gäller det?</span>
              <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </label>


            {(kind === "uppgift" || kind === "kalender") && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Datum</span>
                  <Input type="date" className="min-h-11" value={form.date} onChange={(e) => set({ date: e.target.value })} />
                </label>
                {!(kind === "kalender" && form.endDate) && (
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Tid (frivilligt)</span>
                    <Input type="time" className="min-h-11" value={form.time} onChange={(e) => set({ time: e.target.value })} />
                  </label>
                )}
              </div>
            )}

            {kind === "rutin" && (
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Tid</span>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => set({ time: e.target.value })}
                />
              </label>
            )}


            <details className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-1" defaultOpen={!!(initial?.endDate || initial?.endTime || initial?.note)}>
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground">
                Fler inställningar (frivilligt)
              </summary>
              <div className="space-y-3 border-t border-border/40 py-3">
                {(kind === "uppgift" || kind === "kalender") && !(kind === "kalender" && form.endDate) && (
                  <label className="block space-y-1 text-sm">
                    <span className="text-muted-foreground">Sluttid (frivilligt)</span>
                    <Input type="time" className="min-h-11" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />
                  </label>
                )}
                {kind === "kalender" && (
                  <label className="block space-y-1 text-sm">
                    <span className="text-muted-foreground">Slutdatum (valfritt – för en sammanhängande period)</span>
                    <Input type="date" className="min-h-11" min={form.date || undefined} value={form.endDate} onChange={(e) => set({ endDate: e.target.value, ...(e.target.value ? { time: "", endTime: "" } : {}) })} />
                    <span className="block text-xs text-muted-foreground">En period visas på alla dagar mellan start och slut, utan att boka tid.</span>
                  </label>
                )}
            {(kind === "uppgift" || kind === "tanke") && (
              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Livsområde</span>
                <div className="flex flex-wrap gap-2">
                  {ALL_AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set({ area: a })}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        form.area === a
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {AREA_META[a].emoji} {AREA_META[a].label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(kind === "uppgift" || kind === "kalender") && (
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Anteckning (frivilligt)</span>
                <Textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => set({ note: e.target.value })}
                />
              </label>
            )}


              </div>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button variant="destructive" className="rounded-full" onClick={remove}>
                    Ja, ta bort
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Behåll
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="rounded-full text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={16} /> Ta bort
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="rounded-full" onClick={onClose}>
                  Avbryt
                </Button>
                <Button className="rounded-full" onClick={save}>
                  Spara ändringar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FlowItemActions;
