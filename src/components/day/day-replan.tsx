import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { ArrowRight, ChevronRight, LockKeyhole, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-data";
import { useLang } from "@/hooks/use-language";
import { isActiveOwner } from "@/lib/account-scope";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { buildDayReplan, deferrableReplanTasks, replanFingerprint, type ReplanInput } from "@/lib/day-replan";
import { pacePlanningEntries } from "@/lib/day-pace";
import type { CalendarEntry } from "@/lib/visual-calendar";

type DayReplanProps = { date: string; entries: CalendarEntry[]; capacity: number | null; calendarReady: boolean; calendarError?: boolean };
const currentMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();

export function DayReplanButton({ compact = false, ...props }: DayReplanProps & { compact?: boolean }) {
  const { t } = useLang();
  const { user } = useUser();
  const trigger = useRef<HTMLButtonElement>(null);
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  useEffect(() => { setOpenedFor(null); }, [user?.id, props.date]);
  return <>
    <button ref={trigger} type="button" onClick={() => {
      if (!user?.id || !isActiveOwner(user.id)) { toast.error(t("Vänta tills ditt konto har laddats och försök igen.")); return; }
      setOpenedFor(user.id); track("planning_viewed", { source: "idag" });
    }} className={compact ? "mt-3 flex min-h-11 w-full items-center gap-3 rounded-full px-2 py-2 text-left text-ink hover:bg-mint/40" : "mb-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border/70 bg-mint/40 px-4 py-3 text-left text-ink transition-colors hover:bg-mint/60"}>
      <WandSparkles size={20} className="shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1"><span className={compact ? "block text-sm font-medium" : "block text-base font-medium"}>{t("Få ihop dagen")}</span>{!compact && <span className="block text-sm text-muted-foreground">{t("Prioritera, fördela och hitta återhämtning")}</span>}</span>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
    {openedFor && openedFor === user?.id && isActiveOwner(openedFor) && <DayReplanDialog key={`${openedFor}:${props.date}`} {...props} ownerId={openedFor} onRestoreFocus={() => trigger.current?.focus()} onClose={() => setOpenedFor(null)} />}
  </>;
}

export function DayReplanDialog({ date, entries, capacity, calendarReady, calendarError, ownerId, onClose, onRestoreFocus }: DayReplanProps & { ownerId: string; onClose: () => void; onRestoreFocus?: () => void }) {
  const { t } = useLang();
  const { user } = useUser();
  const { tasks, applyDayReplan } = useTasks();
  const [useCapacity, setUseCapacity] = useState(true);
  const [deferIds, setDeferIds] = useState<string[]>([]);
  const input = (use = useCapacity, defer = deferIds): ReplanInput => ({ tasks, entries, date, nowMinutes: currentMinutes(), capacity, useCapacity: use, deferIds: defer, calendarReady });
  const [draft, setDraft] = useState(() => input());
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clock, setClock] = useState(() => `${todayISO()}:${currentMinutes()}`);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(`${todayISO()}:${currentMinutes()}`), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const preview = useMemo(() => buildDayReplan(draft), [draft]);
  const deferrable = useMemo(() => deferrableReplanTasks(draft), [draft]);
  const changed = replanFingerprint(tasks) !== replanFingerprint(draft.tasks) || replanFingerprint(entries) !== replanFingerprint(draft.entries) ||
    capacity !== draft.capacity || calendarReady !== draft.calendarReady || date !== todayISO() || user?.id !== ownerId || !isActiveOwner(ownerId);
  const chosen = preview.changes.filter(change => selected.includes(change.id));
  const timedOut = clock.startsWith(`${date}:`) && chosen.some(change => change.kind === "time" && Number(change.patch.time?.slice(0, 2)) * 60 + Number(change.patch.time?.slice(3)) < currentMinutes());
  const fixed = pacePlanningEntries(draft.entries).filter(entry => entry.time && !entry.done && !preview.changes.some(change => change.taskId === entry.sourceId && entry.source === "task"));

  function refresh(use = useCapacity, defer = deferIds) {
    setDraft(input(use, defer)); setSelected([]); setError("");
  }
  function toggleDefer(id: string, checked: boolean) {
    const next = checked ? [...deferIds, id] : deferIds.filter(value => value !== id);
    setDeferIds(next); refresh(useCapacity, next);
    // The date change is explicitly chosen here, still requires the final apply action.
    setSelected(next.map(taskId => `${taskId}:tomorrow`));
  }
  function apply() {
    if (saving || !chosen.length) return;
    setSaving(true); setError("");
    try {
      if (changed || timedOut || user?.id !== ownerId || !isActiveOwner(ownerId) || todayISO() !== date) throw new Error(t("Underlaget har ändrats. Uppdatera förslaget innan du använder det."));
      const latest = buildDayReplan(input()).changes;
      if (chosen.some(change => !latest.some(current => replanFingerprint(current) === replanFingerprint(change)))) throw new Error(t("Tiderna har ändrats. Uppdatera förslaget innan du använder det."));
      applyDayReplan(draft.tasks, chosen, date, ownerId);
      track("day_replanned", { source: "idag", count: chosen.length });
      toast.success(`${chosen.length} ${t(chosen.length === 1 ? "ändring gjord. Resten ligger kvar." : "ändringar gjorda. Resten ligger kvar.")}`);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("Kunde inte använda förslaget. Försök igen.")); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent onCloseAutoFocus={event => { if (onRestoreFocus) { event.preventDefault(); onRestoreFocus(); } }} className="grid max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl bg-card p-0 pb-0 sm:max-w-lg sm:p-0 sm:pb-0">
      <DialogHeader className="border-b border-border px-5 pb-4 pr-14 pt-5 text-left">
        <DialogTitle className="font-display text-xl font-medium text-ink">{t("Få ihop dagen")}</DialogTitle>
        <DialogDescription>{t("Prioritera, fördela och hitta återhämtning. Du väljer vad som passar.")}</DialogDescription>
      </DialogHeader>
    <div className="min-h-0 min-w-0 space-y-5 overflow-y-auto px-5 py-4">
      <div className="rounded-2xl bg-mint/40 p-4 text-sm">
        {capacity === null ? <p>{t("Ingen kapacitet är loggad idag. Du kan planera ändå, utifrån dina tider och egna val.")}</p> : <>
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" checked={useCapacity} onChange={event => { setUseCapacity(event.target.checked); refresh(event.target.checked); }} /><span>{t("Utgå från min loggade kapacitet")}: {capacity} %</span></label>
          <p className="mt-1 text-xs text-muted-foreground">{t("Samma senaste incheckning som på Idag. Den kan ge varsammare förslag, men är ingen prognos eller minutbudget.")}</p>
        </>}
      </div>
      {preview.gentle && <p className="text-sm text-muted-foreground">{t("Din kapacitet är låg just nu. Du kan välja ett litet första steg eller låta något valfritt vänta.")}</p>}
      {capacity !== null && useCapacity && <p role="note" className="text-xs text-muted-foreground">{t("Planeringshjälpen tar hänsyn till din loggade kapacitet och kända tider. Pauser och återhämtning är viktiga, men föreslås inte som säkra tidsluckor när aktiviteternas längd är okänd.")}</p>}
      {!calendarReady && <p role="status" className="text-sm text-muted-foreground">{t(calendarError ? "Kalenderunderlaget kunde inte hämtas helt. Inga nya tider föreslås förrän underlaget är tillgängligt." : "Kalenderunderlaget laddas. Inga nya tider föreslås ännu.")}</p>}
      {(changed || timedOut) && <div role="status" className="rounded-2xl border border-border p-3 text-sm"><p>{t("Dagen eller din incheckning har ändrats. Ta fram ett nytt förslag innan du fortsätter.")}</p><Button variant="outline" className="mt-2 min-h-11 rounded-full" onClick={() => refresh()}>{t("Uppdatera förslaget")}</Button></div>}
      {preview.changes.length > 0 ? <fieldset className="space-y-3" disabled={changed || saving}>
        <legend className="mb-2 font-display text-lg">{t("Föreslagna ändringar")}</legend>
        {preview.changes.map(change => <label key={change.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-primary" checked={selected.includes(change.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, change.id] : previous.filter(id => id !== change.id))} />
          <span className="min-w-0 flex-1"><span className="block break-words font-medium">{change.title}</span>
            <span className="my-1 flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">{t(change.before)}</span><ArrowRight size={15} className="shrink-0" aria-hidden /><span className="break-words">{t(change.after)}</span></span>
            <span className="block text-xs text-muted-foreground">{t(change.reason)}</span>
          </span>
        </label>)}
      </fieldset> : <p className="text-sm text-muted-foreground">{t("Inga säkra tidsändringar att föreslå just nu. Det betyder inte att dagen säkert är lagom; längder eller andra uppgifter kan saknas.")}</p>}
      <details className="rounded-2xl border border-border/70 bg-mint/20 p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium">{t("Återhämta · ge plats för det som hjälper")}</summary>
        <div className="space-y-2 pt-2 text-sm text-muted-foreground">
          <p>{t("Återhämtning är också en del av din dag. Fundera på om något som brukar ge dig energi kan få plats, utan att det blir ännu ett måste.")}</p>
          {preview.gentle ? <p>{t("När kapaciteten är låg kan en liten paus eller en välbekant återhämtande aktivitet vara ett alternativ till att lägga till fler uppgifter.")}</p> : <p>{t("Utgå från det som faktiskt hjälper dig, till exempel en kort stund i lugn och ro, musik eller frisk luft.")}</p>}
          <p className="text-xs">{t("Detta är förslag att fundera på, inte bokade tider. Inget läggs till eller flyttas automatiskt.")}</p>
        </div>
      </details>
      {preview.unknownDurations > 0 && <p className="text-xs text-muted-foreground">{preview.unknownDurations} {t("tidsatta aktiviteter saknar en användbar sluttid. Lägg till längden där aktiviteten är planerad för att kunna få säkrare tidsförslag.")}</p>}
      {deferrable.length > 0 && <details className="rounded-2xl border border-border p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium">{t("Vad kan få vänta till imorgon?")}</summary>
        <p className="mt-2 text-xs text-muted-foreground">{t("Välj bara sådant som får byta datum. Det flyttas utan tid, och den nya dagen får ingen uppskattad kapacitet. En ändring här tar fram ett nytt förslag.")}</p>
        <div className="mt-2 space-y-1">{deferrable.map(task => <label key={task.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" checked={deferIds.includes(task.id)} disabled={changed || saving} onChange={event => toggleDefer(task.id, event.target.checked)} /><span className="min-w-0 break-words">{task.title}</span></label>)}</div>
      </details>}
      {fixed.length > 0 && <div className="space-y-2 text-sm"><p className="flex items-center gap-2 font-medium"><LockKeyhole size={15} aria-hidden />{t("Dessa tider ligger kvar")}</p><ul className="space-y-2">{fixed.map(entry => <li key={entry.id} className="flex min-w-0 justify-between gap-3"><span className="min-w-0 break-words">{entry.title}</span><span className="shrink-0 text-muted-foreground">{entry.time}</span></li>)}</ul></div>}
      <p className="text-xs text-muted-foreground">{t("Bara dina valda uppgifter ändras. Bokningar, påminnelser och barnens schema ändras inte. Kapaciteten påverkas inte av att du planerar om.")}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
      <div className="space-y-1 border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button onClick={apply} disabled={!chosen.length || changed || timedOut || saving} className="min-h-11 w-full whitespace-normal rounded-full">{t("Använd valda ändringar")} ({chosen.length})</Button>
        <Button variant="ghost" onClick={onClose} className="min-h-11 w-full rounded-full">{t("Behåll min dag")}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
