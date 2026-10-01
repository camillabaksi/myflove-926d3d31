import { type ReactNode, useMemo, useState } from "react";
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
  duplicateIds,
  children,
}: {
  itemId: string;
  /** Dolda kopior med samma titel och tid som tas bort tillsammans med raden. */
  duplicateIds?: string[];
  className?: string;
  size?: number;
  /** "edit" när vyn redan har en egen ta bort-knapp. */
  only?: "edit";
  /** Samlar åtgärder i en enda meny på ytor där aktiviteten behöver mer plats. */
  compact?: boolean;
  /** Vy-specifika val som flytta/öppna, före ändra och ta bort. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { kind } = kindFromId(itemId);
  const home = externalHome(itemId);

  if (kind === "extern" && !home) return null;

  if (compact) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={className ?? "h-9 w-9 text-muted-foreground"}
              aria-label="Fler val"
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
            duplicateIds={duplicateIds}
            onClose={() => setOpen(false)}
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
          aria-label="Ändra"
          title="Ändra"
          className="press rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
        >
          <Pencil size={size} />
        </button>
        {kind !== "extern" && only !== "edit" && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ta bort"
            title="Ta bort"
            className="press rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 size={size} />
          </button>
        )}
      </div>
      {open && (
          <FlowItemEditDialog
            itemId={itemId}
            duplicateIds={duplicateIds}
            onClose={() => setOpen(false)}
          />
        )}
    </>
  );
}

function FlowItemEditDialog({
  itemId,
  duplicateIds,
  onClose,
}: {
  itemId: string;
  duplicateIds?: string[];
  onClose: () => void;
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
    initial ?? { title: "", date: "", time: "", endTime: "", note: "", area: "vardag" as LifeArea },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const home = externalHome(itemId);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
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
        time: form.time || undefined,
        endTime: form.endTime || undefined,
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
    onClose();
  };

  const remove = () => {
    const ids = Array.from(new Set([itemId, ...(duplicateIds ?? [])]));
    for (const id of ids) {
      const target = kindFromId(id);
      if (target.kind === "uppgift") deleteTask(target.realId);
      else if (target.kind === "kalender") deleteReminder(target.realId);
      else if (target.kind === "quickflow") removePriority(target.realId);
      else if (target.kind === "tanke") removeThought(target.realId);
      else if (target.kind === "rutin")
        setRoutines((prev) => (prev ?? []).filter((r) => r.id !== target.realId));
    }
    toast.success("Borttagen");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
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
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Datum</span>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Tid (frivilligt)</span>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => set({ time: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Sluttid (frivilligt)</span>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set({ endTime: e.target.value })}
                  />
                </label>
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
                  Spara
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
