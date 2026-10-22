import { useState } from "react";
import { Link as PlanningLink } from "@tanstack/react-router";
import { PRIMARY_ADD_CHOICES, TODAY_ADD_KIND } from "@/lib/add-entry-choices";
import { paceEveryday } from "@/components/paceable/design-system";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { AREA_META, ALL_AREAS, useActiveArea, type LifeArea } from "@/lib/life-areas";
import { suggestActivityArea } from "@/lib/smart-area-suggestions";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useFlowItems } from "@/hooks/use-flow-items";
import { isDayFull, planForCapacity } from "@/lib/priority-engine";
import { useLang } from "@/hooks/use-language";
import { todayISO } from "@/lib/day";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CalendarDays, Brain, Bell, CheckSquare } from "lucide-react";

type Kind = "aktivitet" | "handelse" | "paminnelse" | "tanke";

const PRIMARY_ICONS = { task: CheckSquare, event: CalendarDays, reminder: Bell } as const;
const KINDS: { id: Kind; label: string; hint: string; icon: typeof Brain }[] = [
  ...PRIMARY_ADD_CHOICES.map(choice => ({
    id: TODAY_ADD_KIND[choice.id],
    label: choice.label,
    hint: choice.hint,
    icon: PRIMARY_ICONS[choice.id],
  })),
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
  const [chosenArea, setChosenArea] = useState<LifeArea | null>(null);
  const [kind, setKind] = useState<Kind>("aktivitet");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPeriod, setIsPeriod] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [fullWarn, setFullWarn] = useState(false);
  const { mode } = useCapacityMode();
  const { todayOpen } = useFlowItems();
  const plannedToday = planForCapacity(
    todayOpen.map((i) => ({ id: i.id, title: i.title, time: i.time, dueDate: i.dueDate })),
    mode,
    todayISO(),
  ).planned.length;

  const suggestion = suggestActivityArea(text);
  const area: LifeArea = chosenArea ?? suggestion ?? (activeArea === "alla" ? "vardag" : activeArea);
  const needsWhen = kind !== "tanke";

  const reset = () => {
    setText("");
    setChosenArea(null);
    setTime("");
    setEndTime("");
    setEndDate("");
    setIsPeriod(false);
    setDate(todayISO());
    setShowDetails(false);
    setKind("aktivitet");
  };

  const save = (confirmed = false) => {
    const title = text.trim();
    if (!title || !date || (isPeriod && (!endDate || endDate < date))) return;
    // Stopp-principen: mjuk fråga, aldrig ett förbud.
    if (!confirmed && kind === "aktivitet" && date === todayISO() && isDayFull(plannedToday, mode)) {
      setFullWarn(true);
      return;
    }
    setFullWarn(false);
    if (kind === "tanke") {
      addThought({ text: title, level: "tanke" });
    } else if (isPeriod) {
      addReminder(title, date, undefined, "none", undefined, undefined, "Sammanhängande period – ingen automatiskt upptagen tid.", area, endDate, "unknown");
    } else if (kind === "aktivitet") {
      addTask(title, date, {
        time: time || undefined,
        endTime: time && endTime ? endTime : undefined,
        area,
      });
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
      <DialogContent className={paceEveryday.dialog}>
        <DialogHeader>
          <DialogTitle className="text-lg">{t("Lägg till")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); save(); }
            }}
            maxLength={240}
            aria-label={t("Vad vill du lägga till?")}
            placeholder={t("Vad dök upp? T.ex. Ring tandläkaren")}
            className="min-h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink"
          />
          {fullWarn && (
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 text-sm" role="alert">
              <p className="text-ink">
                {t("Du har redan en ganska full dag. Vill du lägga till den här ändå, eller ska vi flytta något annat?")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="min-h-11 rounded-full" onClick={() => save(true)}>
                  {t("Behåll")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11 rounded-full"
                  onClick={() => {
                    save(true);
                    onOpenChange(false);
                    window.setTimeout(
                      () => document.querySelector('[data-testid="capacity-plan"]')?.scrollIntoView({ behavior: "smooth" }),
                      200,
                    );
                  }}
                >
                  {t("Flytta något annat")}
                </Button>
              </div>
            </div>
          )}

          <button type="button" className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border/60 bg-card/70 px-3 text-left text-sm font-medium text-ink" aria-expanded={showDetails} aria-controls="quick-add-details" onClick={() => setShowDetails((value) => !value)}>
            <span>{t("Fler val")} · {t(KINDS.find((item) => item.id === kind)?.label ?? "Aktivitet")}</span>
            <span aria-hidden>{showDetails ? "−" : "+"}</span>
          </button>
          <div id="quick-add-details" className={showDetails ? "space-y-3" : "hidden"}>
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
            <label className="block text-xs text-muted-foreground">
              {t("Område")} {suggestion && chosenArea === null && <span className="ml-1 text-primary">· {t("Föreslaget utifrån texten")}</span>}
              <select value={area} onChange={(event) => setChosenArea(event.target.value as LifeArea)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-ink" aria-label={t("Område")}>
                {ALL_AREAS.map((id) => <option key={id} value={id}>{AREA_META[id].label}</option>)}
              </select>
            </label>
          )}

          {needsWhen && (
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={isPeriod} onChange={(e) => { setIsPeriod(e.target.checked); setEndDate(e.target.checked ? date : ""); setTime(""); setEndTime(""); }} />
              {t("Sammanhängande period (flera dagar)")}
            </label>
          )}
          {needsWhen && (
            <div className={cn("grid gap-2", isPeriod ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}>
              <label className="text-xs text-muted-foreground">
                {t(isPeriod ? "Startdatum" : "Datum")}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); if (isPeriod && endDate < e.target.value) setEndDate(e.target.value); }}
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
                />
              </label>
              {isPeriod ? <label className="text-xs text-muted-foreground">
                {t("Slutdatum")}
                <input type="date" min={date} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-2xl border border-border bg-background px-3 text-base text-ink" />
              </label> : <label className="text-xs text-muted-foreground">
                {t("Tid (valfritt)")}
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
                />
              </label>}
            </div>
          )}
          {needsWhen && !isPeriod && time && (
            <label className="block text-xs text-muted-foreground">
              {t("Sluttid (valfritt)")}
              <input
                type="time"
                value={endTime}
                min={time}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
              />
            </label>
          )}

          </div>
          <button
            type="button"
            onClick={() => save()}
            disabled={!text.trim() || !date || (isPeriod && (!endDate || endDate < date))}
            className="min-h-12 w-full rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t("Spara")}
          </button>

          <PlanningLink to="/planera" search={{ audience: "me", period: "today" }} onClick={() => onOpenChange(false)} className="flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-primary underline-offset-4 hover:underline">{t("Planera flera aktiviteter i stället")}</PlanningLink>
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
