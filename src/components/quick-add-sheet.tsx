import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useActiveArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CalendarDays, Brain, Bell, CheckSquare } from "lucide-react";

type Kind = "aktivitet" | "handelse" | "paminnelse" | "tanke";

const KINDS: { id: Kind; label: string; hint: string; icon: typeof Brain }[] = [
  { id: "aktivitet", label: "Aktivitet", hint: "Något du ska göra", icon: CheckSquare },
  { id: "handelse", label: "Händelse", hint: "Något som händer en tid", icon: CalendarDays },
  { id: "paminnelse", label: "Påminnelse", hint: "Bli påmind", icon: Bell },
  { id: "tanke", label: "Bara en tanke", hint: "Strukturera sen", icon: Brain },
];

/**
 * Fånga först – strukturera sen.
 *
 * Ett enda litet formulär som sparar i MyFloves befintliga data: uppgifter
 * (kalender/Idag/Flow), påminnelser och Quickflow. Inget nytt system, ingen
 * extra state – bara en snabbare väg in från Hem.
 */
export default function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLang();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { add: addThought } = useQuickflow();
  const { activeArea } = useActiveArea();

  const [text, setText] = useState("");
  const [kind, setKind] = useState<Kind>("aktivitet");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const area = activeArea === "alla" ? "vardag" : activeArea;
  const needsWhen = kind !== "tanke";

  const reset = () => {
    setText("");
    setTime("");
    setDate(todayISO());
  };

  const save = () => {
    const title = text.trim();
    if (!title) return;
    if (kind === "tanke") {
      addThought({ text: title, level: "tanke" });
    } else if (kind === "aktivitet") {
      addTask(title, date, { time: time || undefined, area });
    } else {
      addReminder(
        title,
        date,
        time || undefined,
        "none",
        undefined,
        kind === "paminnelse" ? 0 : undefined,
        undefined,
        area,
      );
    }
    track("add_created", { source: "hem", method: kind });
    setSaved(title);
    reset();
    window.setTimeout(() => setSaved(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("Lägg till")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            maxLength={240}
            placeholder={t("Vad dök upp? T.ex. Ring tandläkaren")}
            className="min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink"
          />

          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKind(k.id)}
                  className={cn(
                    "flex min-h-14 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all",
                    on
                      ? "border-primary bg-primary/10 text-ink"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <k.icon size={18} className="shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{t(k.label)}</span>
                    <span className="block text-xs text-muted-foreground">{t(k.hint)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {needsWhen && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                {t("Datum")}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                {t("Tid (valfritt)")}
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={!text.trim()}
            className="min-h-12 w-full rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t("Spara")}
          </button>

          <p aria-live="polite" className="text-center text-xs text-muted-foreground">
            {saved
              ? `${t("Sparat")}: ${saved}`
              : t("Du behöver inte fylla i allt – det räcker att skriva något.")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
