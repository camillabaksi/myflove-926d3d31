import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { PacePageHeader } from "@/components/paceable/page-header";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReminders, type Reminder, type RepeatMode } from "@/hooks/use-data";
import PushStatusCard from "@/components/push-status-card";
import { useToast } from "@/hooks/use-toast";
import { todayISO } from "@/lib/day";
import { ALL_AREAS, AREA_META, type LifeArea } from "@/lib/life-areas";
import { suggestActivityArea } from "@/lib/smart-area-suggestions";
import { groupReminders, reminderStatus, type ReminderStatus } from "@/lib/reminder-status";
import {
  ArrowRight,
  BellRing,
  Plus,
  Trash2,
  Undo2,
  Pencil,
  Check,
  X,
  CalendarClock,
  Pill,
  History,
} from "lucide-react";

const inputClass =
  "p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base w-full";
const statusLabels: Record<ReminderStatus, string> = {
  active: "Aktiv",
  passed: "Passerad",
  completed: "Klar",
  canceled: "Avbokad",
};
const repeatLabels: Record<RepeatMode, string> = {
  none: "",
  daily: "varje dag",
  weekdays: "vardagar",
  weekly: "varje vecka",
};
type EditPatch = Pick<Reminder, "title" | "date" | "time" | "note"> &
  Partial<Pick<Reminder, "endDate" | "endTime" | "completed" | "canceled">>;

function StatusBadge({ status }: { status: ReminderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${status === "active" ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-primary" : "bg-muted-foreground"}`}
      />
      {statusLabels[status]}
    </span>
  );
}

function ReminderRow({
  reminder,
  status,
  onEdit,
  onPlanAgain,
  onCancel,
  onRestore,
  onDelete,
}: {
  reminder: Reminder;
  status: ReminderStatus;
  onEdit: () => void;
  onPlanAgain: () => void;
  onCancel: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const canceled = status === "canceled";
  const repeat = reminder.repeat ?? "none";
  return (
    <li
      className={`pace-card-surface rounded-xl border border-border/60 bg-card px-3 py-2.5 ${canceled ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`pace-type-activity font-medium text-ink ${canceled ? "line-through" : ""}`}
          >
            {reminder.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock size={14} aria-hidden />
            {repeat !== "none" ? "Från " : ""}
            {reminder.date}
            {reminder.endDate && reminder.endDate > reminder.date ? ` – ${reminder.endDate}` : ""}
            {reminder.time ? (
              <span className="pace-type-time">
                {" "}
                · {reminder.time}
                {reminder.endTime ? `–${reminder.endTime}` : ""}
              </span>
            ) : (
              " · hela dagen"
            )}
            {repeat !== "none" ? ` · ${repeatLabels[repeat]}` : ""}
          </p>
          {reminder.note && <p className="mt-1 text-sm text-muted-foreground">{reminder.note}</p>}
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={onEdit}>
          <Pencil size={14} className="mr-1.5" aria-hidden /> Ändra
        </Button>
        {status === "passed" ||
        status === "completed" ||
        (canceled &&
          (reminder.completed || reminderStatus({ ...reminder, canceled: false }) === "passed")) ? (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={onPlanAgain}>
            <CalendarClock size={14} className="mr-1.5" aria-hidden /> Planera igen
          </Button>
        ) : canceled ? (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={onRestore}>
            <Undo2 size={14} className="mr-1.5" aria-hidden /> Aktivera igen
          </Button>
        ) : null}
        {!canceled && status !== "completed" && (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={onCancel}>
            <X size={14} className="mr-1.5" aria-hidden /> Avboka
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={14} className="mr-1.5" aria-hidden /> Ta bort
        </Button>
      </div>
    </li>
  );
}

/** A page-level snapshot keeps an open draft intact when the clock moves its row to history. */
function ReminderEditor({
  reminder,
  planAgain,
  onSave,
  onClose,
}: {
  reminder: Reminder;
  planAgain: boolean;
  onSave: (patch: EditPatch) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(reminder.title);
  const [date, setDate] = useState(planAgain ? todayISO() : reminder.date);
  const [time, setTime] = useState(reminder.time ?? "");
  const [endDate, setEndDate] = useState(reminder.endDate ?? "");
  const [endTime, setEndTime] = useState(reminder.endTime ?? "");
  const [note, setNote] = useState(reminder.note ?? "");
  const [error, setError] = useState("");
  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date) return;
    if (endDate && endDate < date) {
      setError("Slutdatum behöver vara samma dag som startdatum eller senare.");
      return;
    }
    const patch: EditPatch = {
      title: title.trim(),
      date,
      time: time || undefined,
      note: note.trim() || undefined,
      endDate: endDate || undefined,
      ...(reminder.endTime ? { endTime: endTime || undefined } : {}),
      ...(planAgain ? { completed: false, canceled: false } : {}),
    };
    // A new plan must start in the future, even if the original period ends later.
    if (
      planAgain &&
      reminderStatus({
        ...reminder,
        ...patch,
        repeat: "none",
        endDate: undefined,
        endTime: undefined,
      }) === "passed"
    ) {
      setError("Välj ett datum eller klockslag som inte har passerat.");
      return;
    }
    onSave(patch);
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{planAgain ? "Planera påminnelsen igen" : "Ändra påminnelse"}</DialogTitle>
          <DialogDescription>
            {planAgain
              ? "Välj ett nytt datum eller klockslag. Påminnelsen aktiveras när du sparar."
              : (reminder.repeat ?? "none") !== "none"
                ? "Ändringar av datum, klockslag eller text gäller hela den återkommande serien, inte bara en enskild dag."
                : "Ändra datum, klockslag eller anteckning för påminnelsen."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            className={inputClass}
            aria-label="Vad gäller det?"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Vad gäller det?"
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
            <input
              className={inputClass}
              type="date"
              aria-label="Datum"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              className={inputClass}
              type="time"
              aria-label="Klockslag"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
              {(
                <input
                  className={inputClass}
                  type="date"
                  aria-label="Slutdatum"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
              {reminder.endTime && (
                <input
                  className={inputClass}
                  type="time"
                  aria-label="Sluttid"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              )}
            </div>
          <input
            className={inputClass}
            aria-label="Anteckning (valfritt)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anteckning (valfritt)"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="rounded-xl">
              <Check size={16} className="mr-1.5" aria-hidden />{" "}
              {planAgain ? "Spara och aktivera" : "Spara"}
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={onClose}>
              <X size={16} className="mr-1.5" aria-hidden /> Avbryt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RemindersPage() {
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    cancelReminder,
    restoreReminder,
  } = useReminders();
  const { toast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [editor, setEditor] = useState<{ reminder: Reminder; planAgain: boolean } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [chosenArea, setChosenArea] = useState<LifeArea | null>(null);
  const suggestedArea = suggestActivityArea(title);
  const newArea = chosenArea ?? suggestedArea ?? "vardag";
  const [date, setDate] = useState(() => todayISO());
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [lead, setLead] = useState(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const { active, history, canceled } = useMemo(
    () => groupReminders(reminders, now),
    [reminders, now],
  );

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date) return;
    addReminder(
      title.trim(),
      date,
      time || undefined,
      repeat,
      undefined,
      lead || undefined,
      note.trim() || undefined,
      newArea,
    );
    setTitle("");
    setChosenArea(null);
    setTime("");
    setNote("");
    toast({ description: "Påminnelsen är tillagd 🔔" });
    setAddOpen(false);
  };
  const renderRow = (reminder: Reminder) => (
    <ReminderRow
      key={reminder.id}
      reminder={reminder}
      status={reminderStatus(reminder, now)}
      onEdit={() => setEditor({ reminder: { ...reminder }, planAgain: false })}
      onPlanAgain={() => setEditor({ reminder: { ...reminder }, planAgain: true })}
      onCancel={() => {
        cancelReminder(reminder.id);
        toast({ description: "Påminnelsen är avbokad" });
      }}
      onRestore={() => {
        restoreReminder(reminder.id);
        toast({ description: "Påminnelsen är aktiv igen" });
      }}
      onDelete={() => deleteReminder(reminder.id)}
    />
  );

  return (
    <Layout>
      <MyFlovePageGrid area="idag" className="pace-ds pace-compact-page pace-next-page pace-next-health pace-next-tools">
        <MyFloveWide>
          <PacePageHeader icon={BellRing} title="Påminnelser" titleId="reminders-title" description="Håll koll på det du inte vill glömma." action={
            <Button onClick={() => setAddOpen(true)} className="min-h-11 shrink-0 rounded-xl px-3">
              <Plus size={17} className="mr-1.5" aria-hidden /> Lägg till
            </Button>
          } />
        </MyFloveWide>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Ny påminnelse</DialogTitle>
              <DialogDescription>
                Välj datum och lägg till ett klockslag om du vill få en notis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                className={inputClass}
                aria-label="Vad ska du påminnas om?"
                required
                value={title}
                onChange={(e) => { setTitle(e.target.value); setChosenArea(null); }}
                placeholder="Vad ska du påminnas om?"
              />
              <label className="block text-sm text-muted-foreground">Område {suggestedArea && chosenArea === null && <span className="text-xs">· Föreslaget</span>}<select aria-label="Område" className={inputClass} value={newArea} onChange={e => setChosenArea(e.target.value as LifeArea)}>{ALL_AREAS.map(id => <option key={id} value={id}>{AREA_META[id].label}</option>)}</select></label>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                <input
                  className={inputClass}
                  type="date"
                  aria-label="Datum"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  className={inputClass}
                  type="time"
                  aria-label="Klockslag"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                <select
                  className={inputClass}
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as RepeatMode)}
                  aria-label="Upprepning"
                >
                  <option value="none">Ingen upprepning</option>
                  <option value="daily">Varje dag</option>
                  <option value="weekdays">Vardagar</option>
                  <option value="weekly">Varje vecka</option>
                </select>
                <select
                  className={inputClass}
                  value={lead}
                  onChange={(e) => setLead(Number(e.target.value))}
                  aria-label="Förvarning"
                >
                  <option value={0}>Notis på tiden</option>
                  <option value={5}>5 min innan</option>
                  <option value={15}>15 min innan</option>
                  <option value={30}>30 min innan</option>
                  <option value={60}>1 timme innan</option>
                </select>
              </div>
              <input
                className={inputClass}
                aria-label="Anteckning (valfritt)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anteckning (valfritt)"
              />
              <Button type="submit" className="h-12 w-full rounded-xl">
                <Plus size={18} className="mr-2" aria-hidden /> Lägg till påminnelse
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {editor && (
          <ReminderEditor
            key={editor.reminder.id}
            reminder={editor.reminder}
            planAgain={editor.planAgain}
            onClose={() => setEditor(null)}
            onSave={(patch) => {
              updateReminder(editor.reminder.id, patch);
              toast({
                description: editor.planAgain
                  ? "Påminnelsen är planerad och aktiv igen"
                  : "Ändringen är sparad",
              });
            }}
          />
        )}
        <MyFloveWide>
          <MyFloveBlock
            title={`Aktiva (${active.length})`}
            collapseId="reminders-active"
            icon={BellRing}
          >
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga aktiva påminnelser just nu.</p>
            ) : (
              <ul className="space-y-1.5" aria-label="Aktiva påminnelser">
                {active.map(renderRow)}
              </ul>
            )}
          </MyFloveBlock>
          <details className="group rounded-2xl border border-border/60 bg-card/70 px-3 sm:px-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><BellRing size={16} aria-hidden /> Aviseringar och inställningar</span>
              <span className="text-xs text-muted-foreground">Visa</span>
            </summary>
            <div className="border-t border-border/50 pb-3 pt-2"><PushStatusCard /></div>
          </details>
          <MyFloveBlock title="Medicinpåminnelser" icon={Pill} surface="mint">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mediciner, doser och tider hanteras tillsammans med dina rutiner.
              </p>
              <Link
                href="/daglig-rutin"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Öppna Rutiner &amp; medicin <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </MyFloveBlock>
          <MyFloveBlock
            title={`Historik (${history.length})`}
            collapseId="reminders-history"
            defaultCollapsed
            icon={History}
            surface="plain"
          >
            <p className="text-sm text-muted-foreground">
              Passerade engångspåminnelser och påminnelser du markerat som klara. Passerad betyder
              att tiden har gått, inte att en notis säkert har kommit fram. Välj Planera igen för
              ett nytt datum.
            </p>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen historik ännu.</p>
            ) : (
              <ul className="space-y-3" aria-label="Påminnelsehistorik">
                {history.map(renderRow)}
              </ul>
            )}
          </MyFloveBlock>
          <MyFloveBlock
            title={`Avbokade (${canceled.length})`}
            collapseId="reminders-canceled"
            icon={BellRing}
            surface="plain"
          >
            {canceled.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inget avbokat.</p>
            ) : (
              <ul className="space-y-3" aria-label="Avbokade påminnelser">
                {canceled.map(renderRow)}
              </ul>
            )}
          </MyFloveBlock>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
