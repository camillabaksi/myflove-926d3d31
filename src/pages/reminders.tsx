import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReminders, type Reminder, type RepeatMode } from "@/hooks/use-data";
import { useReminderSync } from "@/hooks/use-reminder-sync";
import PushStatusCard from "@/components/push-status-card";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/push-notifications";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

const todayIso = () => new Date().toISOString().slice(0, 10);

const inputClass =
  "p-3 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base w-full";

function StatusBadge({ canceled }: { canceled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold ${
        canceled ? "bg-muted text-muted-foreground" : "bg-primary/12 text-primary"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${canceled ? "bg-muted-foreground" : "bg-primary"}`}
      />
      {canceled ? "Avbokad" : "Aktiv"}
    </span>
  );
}

function ReminderRow({
  reminder,
  onSave,
  onCancel,
  onRestore,
  onDelete,
}: {
  reminder: Reminder;
  onSave: (patch: {
    title: string;
    date: string;
    time: string | undefined;
    note: string | undefined;
  }) => void;
  onCancel: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(reminder.title);
  const [date, setDate] = useState(reminder.date);
  const [time, setTime] = useState(reminder.time ?? "");
  const [note, setNote] = useState(reminder.note ?? "");
  const canceled = Boolean(reminder.canceled);

  const startEdit = () => {
    setTitle(reminder.title);
    setDate(reminder.date);
    setTime(reminder.time ?? "");
    setNote(reminder.note ?? "");
    setEditing(true);
  };

  return (
    <li
      className={`rounded-2xl border border-border bg-card p-4 shadow-soft ${canceled ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium text-ink ${canceled ? "line-through" : ""}`}>
            {reminder.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock size={14} />
            {reminder.date}
            {reminder.time ? ` · ${reminder.time}` : " · hela dagen"}
            {reminder.repeat && reminder.repeat !== "none" ? " · återkommande" : ""}
          </p>
          {reminder.note && <p className="mt-1 text-sm text-muted-foreground">{reminder.note}</p>}
        </div>
        <StatusBadge canceled={canceled} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" className="rounded-xl" onClick={startEdit}>
          <Pencil size={14} className="mr-1.5" /> Ändra
        </Button>
        {canceled ? (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={onRestore}>
            <Undo2 size={14} className="mr-1.5" /> Aktivera igen
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={onCancel}>
            <X size={14} className="mr-1.5" /> Avboka
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={14} className="mr-1.5" /> Ta bort
        </Button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ändra påminnelse</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vad gäller det?"
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
              <input
                className={inputClass}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                className={inputClass}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anteckning (valfritt)"
            />
            <div className="flex gap-2">
              <Button
                className="rounded-xl"
                onClick={() => {
                  if (!title.trim() || !date) return;
                  onSave({
                    title: title.trim(),
                    date,
                    time: time || undefined,
                    note: note.trim() || undefined,
                  });
                  setEditing(false);
                }}
              >
                <Check size={16} className="mr-1.5" /> Spara
              </Button>
              <Button variant="ghost" className="rounded-xl" onClick={() => setEditing(false)}>
                <X size={16} className="mr-1.5" /> Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </li>
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
  useReminderSync();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [lead, setLead] = useState(0);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const askPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === "granted")
      toast({ description: "Notiser är på – du får en signal när det är dags 🔔" });
    else if (res === "denied")
      toast({ description: "Notiser är blockerade i webbläsarens inställningar" });
  };

  const { active, canceled } = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
    return {
      active: sorted.filter((r) => !r.canceled),
      canceled: sorted.filter((r) => r.canceled),
    };
  }, [reminders]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addReminder(
      title.trim(),
      date,
      time || undefined,
      repeat,
      undefined,
      lead || undefined,
      note.trim() || undefined,
    );
    setTitle("");
    setTime("");
    setNote("");
    toast({ description: "Påminnelsen är tillagd 🔔" });
    setAddOpen(false);
  };

  return (
    <Layout>
      <MyFlovePageGrid area="idag">
        <MyFloveWide>
          <MyFloveHeader
            title="Påminnelser"
            emojiKey="reminder"
            description="Lägg till, ändra eller avboka. Aktiva påminnelser ger en notis när det är dags."
            why="Påminnelser ska avlasta minnet – inte skapa fler saker att hålla reda på."
          />
        </MyFloveWide>

        <MyFloveBlock
          title="Aviseringar"
          subtitle="Notis när det är dags"
          icon={BellRing}
          surface="plain"
          className="pace-form pace-form-surface"
          area="idag"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              {permission === "granted"
                ? "Notiser är på på den här enheten."
                : permission === "unsupported"
                  ? "Webbläsaren stödjer inte notiser."
                  : permission === "denied"
                    ? "Notiser är blockerade i webbläsaren."
                    : "Slå på notiser så påminner appen dig."}
            </p>
            {permission === "default" && (
              <Button onClick={askPermission} className="h-10 shrink-0 rounded-xl">
                Tillåt notiser
              </Button>
            )}
          </div>
          <PushStatusCard className="mt-2" />
        </MyFloveBlock>

        <MyFloveWide>
          <Button onClick={() => setAddOpen(true)} className="h-12 w-full rounded-xl">
            <Plus size={18} className="mr-2" /> Lägg till påminnelse
          </Button>
        </MyFloveWide>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle>Ny påminnelse</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vad ska du påminnas om?"
              />
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2">
                <input
                  className={inputClass}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  className={inputClass}
                  type="time"
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
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anteckning (valfritt)"
              />
              <Button type="submit" className="h-12 w-full rounded-xl">
                <Plus size={18} className="mr-2" /> Lägg till påminnelse
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <MyFloveWide>
          <MyFloveBlock
            title={`Aktiva (${active.length})`}
            collapseId="reminders-active"
            icon={BellRing}
          >
            <CollapsibleSection
              title={`Aktiva (${active.length})`}
              id="Aktiva påminnelser"
              headingClassName="sr-only"
              className="space-y-3"
            >
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga aktiva påminnelser just nu.</p>
              ) : (
                <ul className="space-y-3">
                  {active.map((r) => (
                    <ReminderRow
                      key={r.id}
                      reminder={r}
                      onSave={(patch) => {
                        updateReminder(r.id, patch);
                        toast({ description: "Ändringen är sparad" });
                      }}
                      onCancel={() => {
                        cancelReminder(r.id);
                        toast({ description: "Påminnelsen är avbokad" });
                      }}
                      onRestore={() => restoreReminder(r.id)}
                      onDelete={() => deleteReminder(r.id)}
                    />
                  ))}
                </ul>
              )}
            </CollapsibleSection>
          </MyFloveBlock>

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
            title={`Avbokade (${canceled.length})`}
            collapseId="reminders-canceled"
            icon={BellRing}
            surface="plain"
          >
            <CollapsibleSection
              title={`Avbokade (${canceled.length})`}
              id="Avbokade påminnelser"
              headingClassName="sr-only"
              className="space-y-3"
            >
              {canceled.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inget avbokat.</p>
              ) : (
                <ul className="space-y-3">
                  {canceled.map((r) => (
                    <ReminderRow
                      key={r.id}
                      reminder={r}
                      onSave={(patch) => updateReminder(r.id, patch)}
                      onCancel={() => cancelReminder(r.id)}
                      onRestore={() => {
                        restoreReminder(r.id);
                        toast({ description: "Påminnelsen är aktiv igen" });
                      }}
                      onDelete={() => deleteReminder(r.id)}
                    />
                  ))}
                </ul>
              )}
            </CollapsibleSection>
          </MyFloveBlock>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
