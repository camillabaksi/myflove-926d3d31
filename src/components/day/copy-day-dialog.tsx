import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { MyFloveModal } from "@/components/myflove/modal";
import { Button } from "@/components/ui/button";
import { useReminders, useTasks } from "@/hooks/use-data";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, parseISODate } from "@/lib/day";
import {
  buildReminderCopies,
  buildTaskCopies,
  copyableReminders,
  copyableTasks,
} from "@/lib/copy-day";

/** Knapp + panel: kopiera en egen dag till en eller flera andra dagar. */
export function CopyDayButton({ date, className, shortLabel = false }: { date: string; className?: string; shortLabel?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={t("Kopiera dagen")}
        onClick={() => setOpen(true)}
        className={
          className ??
          "min-h-11 gap-1.5 rounded-xl px-3 text-sm"
        }
      >
        <Copy size={16} className="text-primary" aria-hidden /> {shortLabel ? t("Kopiera") : t("Kopiera dagen")}
      </Button>
      {open && <CopyDayDialog date={date} open={open} onOpenChange={setOpen} />}
    </>
  );
}

function CopyDayDialog({
  date,
  open,
  onOpenChange,
}: {
  date: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t, lang } = useLang();
  const { tasks, addTaskCopies } = useTasks();
  const { reminders, addReminderCopies } = useReminders();
  const [selected, setSelected] = useState<string[]>([addDaysISO(date, 1)]);
  const [picker, setPicker] = useState("");

  const srcTasks = useMemo(() => copyableTasks(tasks, date), [tasks, date]);
  const srcRem = useMemo(() => copyableReminders(reminders, date), [reminders, date]);
  const total = srcTasks.length + srcRem.length;
  const locale = lang === "en" ? "en-GB" : "sv-SE";
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(date, i + 1));
  const extra = selected.filter((d) => !days.includes(d));

  const toggle = (d: string) =>
    setSelected((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d].sort()));

  const label = (d: string) =>
    parseISODate(d).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  const doCopy = () => {
    const tc = buildTaskCopies(tasks, srcTasks, selected);
    const rc = buildReminderCopies(reminders, srcRem, selected);
    addTaskCopies(tc);
    addReminderCopies(rc);
    const n = tc.length + rc.length;
    if (n) toast.success(`${n} ${t("aktiviteter kopierades till")} ${selected.length} ${selected.length === 1 ? t("dag") : t("dagar")}.`);
    else toast.info(t("Allt fanns redan på de valda dagarna."));
    onOpenChange(false);
  };

  return (
    <MyFloveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("Kopiera dagen")}
      description={`${label(date)} · ${total} ${total === 1 ? t("sak att kopiera") : t("saker att kopiera")}`}
      footer={
        <Button onClick={doCopy} disabled={!total || !selected.length} className="rounded-full">
          <Copy size={16} /> {t("Kopiera till")} {selected.length} {selected.length === 1 ? t("dag") : t("dagar")}
        </Button>
      }
    >
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Det finns inget kvar att kopiera den här dagen.")}</p>
      ) : (
        <div className="space-y-4">
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-2xl bg-secondary/30 p-3 text-sm">
            {[...srcTasks.map((x) => ({ id: x.id, title: x.title, time: x.time })), ...srcRem.map((x) => ({ id: x.id, title: x.title, time: x.time }))]
              .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"))
              .map((x) => (
                <li key={x.id} className="truncate">
                  {x.time && <span className="mr-1.5 font-semibold text-primary">{x.time}</span>}
                  {x.title}
                </li>
              ))}
          </ul>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{t("Välj en eller flera dagar")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {days.map((d) => {
                const on = selected.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(d)}
                    className={`rounded-2xl border px-2 py-2 text-sm capitalize transition-colors ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {label(d)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={picker}
              min={addDaysISO(date, 1)}
              onChange={(e) => setPicker(e.target.value)}
              aria-label={t("Annat datum")}
              className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!picker || picker === date}
              onClick={() => {
                if (picker && !selected.includes(picker)) setSelected((s) => [...s, picker].sort());
                setPicker("");
              }}
            >
              {t("Lägg till datum")}
            </Button>
          </div>
          {extra.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extra.map((d) => (
                <button key={d} type="button" onClick={() => toggle(d)} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {label(d)} ✕
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t("Avklarade saker kopieras inte. Finns samma sak redan på en dag hoppas den över.")}
          </p>
        </div>
      )}
    </MyFloveModal>
  );
}
