import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { MyFloveBlock } from "@/components/myflove/block";
import { Button } from "@/components/ui/button";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, dayOf, parseISODate, todayISO } from "@/lib/day";
import { categoryEmoji, categoryLabel, FRICTION_LEVELS, kindEmoji, type EnergyDirection } from "@/lib/energy-flow";

const DIRECTIONS: { value: EnergyDirection; label: string }[] = [
  { value: "gives", label: "Gav energi" },
  { value: "drains", label: "Tog energi" },
  { value: "both", label: "Både och" },
  { value: "neutral", label: "Ingen skillnad" },
];

/** Browse the existing account-owned factors by local date. Editing history
 * never emits a capacity-adjustment offer or creates another energy entry. */
export default function EnergyHistory() {
  const { entries, updateFactor, removeFactor, toggleCounts, loadDay, signedIn } = useEnergyFlow();
  const { t, locale } = useLang();
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);
  const [date, setDate] = useState(today);
  const [loadingDay, setLoadingDay] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = useMemo(() => entries
    .filter((entry) => dayOf(entry.occurredAt) === date)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)), [entries, date]);
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    setLoadingDay(true);
    setLoadError(false);
    void loadDay(date).catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoadingDay(false); });
    return () => { cancelled = true; };
  }, [date, loadDay, signedIn, retry]);
  const label = date === today ? t("Idag") : date === yesterday ? t("Igår") :
    parseISODate(date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try { await action(); }
    catch { setError(t("Ändringen kunde inte sparas. Försök igen.")); }
    finally { setBusy(false); }
  };
  const chooseDate = (next: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next > today) return;
    setDate(next);
    setError(null);
  };

  return (
    <MyFloveBlock area="halsa" icon={CalendarClock} title={t("Dina energiposter")}
      subtitle={t("Se tidigare dagar och rätta hur något påverkade dig.")}
      collapsible status={`${rows.length} ${t("registrerat")}`}>
      <div className="flex flex-wrap items-end gap-2">
        <Button variant="outline" className="min-h-11" aria-pressed={date === today} onClick={() => chooseDate(today)}>{t("Idag")}</Button>
        <Button variant="outline" className="min-h-11" aria-pressed={date === yesterday} onClick={() => chooseDate(yesterday)}>{t("Igår")}</Button>
        <label className="min-w-0 flex-1 text-sm">
          <span className="block">{t("Välj dag")}</span>
          <input type="date" aria-label={t("Välj dag")} max={today} value={date}
            onChange={(event) => chooseDate(event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3" />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" className="h-11 w-11 shrink-0 p-0" aria-label={t("Föregående dag")} onClick={() => chooseDate(addDaysISO(date, -1))}><ChevronLeft size={18} /></Button>
        <h3 className="min-w-0 text-center font-semibold" aria-live="polite">{label}</h3>
        <Button variant="ghost" className="h-11 w-11 shrink-0 p-0" aria-label={t("Nästa dag")} disabled={date >= today} onClick={() => chooseDate(addDaysISO(date, 1))}><ChevronRight size={18} /></Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loadingDay && <p role="status">{t("Hämtar dagens poster…")}</p>}
      {loadError && <div><p role="alert">{t("Kunde inte hämta alla poster för dagen.")}</p><Button variant="outline" className="min-h-11" onClick={() => setRetry((value) => value + 1)}>{t("Försök igen")}</Button></div>}
      {rows.length === 0 && !loadingDay && !loadError ? <p className="text-sm text-muted-foreground">{t("Inga energiposter den här dagen.")}</p> : (
        <ul className="space-y-3">
          {rows.map((entry) => (
            <li key={entry.id} className="min-w-0 space-y-2 rounded-2xl bg-secondary/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className={`min-w-0 break-words font-medium ${entry.countsTowardScore ? "" : "opacity-60"}`}>{kindEmoji(entry.kind)} {entry.title}</span>
                <time dateTime={entry.occurredAt} className="shrink-0 text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
              <p className="text-xs text-muted-foreground">{categoryEmoji(entry.category)} {t(categoryLabel(entry.category))}</p>
              <div className="flex flex-wrap gap-2">
                <label className="min-w-0 flex-1 text-xs">
                  {t("Energipåverkan")}
                  <select aria-label={`${t("Energipåverkan för")} ${entry.title}`} value={entry.direction} disabled={busy || loadingDay}
                    onChange={(event) => void run(() => updateFactor(entry.id, { direction: event.target.value as EnergyDirection }))}
                    className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-2 text-sm">
                    {DIRECTIONS.map((direction) => <option key={direction.value} value={direction.value}>{t(direction.label)}</option>)}
                  </select>
                </label>
                {(entry.direction === "gives" || entry.direction === "drains") && (
                  <label className="text-xs">{t("Hur mycket?")}
                    <select aria-label={`${t("Styrka för")} ${entry.title}`} value={entry.strength} disabled={busy || loadingDay}
                      onChange={(event) => void run(() => updateFactor(entry.id, { strength: Number(event.target.value) }))}
                      className="mt-1 block min-h-11 rounded-xl border border-input bg-card px-2 text-sm">
                      {[1, 2, 3, 4, 5].map((strength) => <option key={strength} value={strength}>{strength}{strength === 1 ? ` – ${t("Lite")}` : strength === 5 ? ` – ${t("Mycket")}` : ""}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <details>
                <summary className="min-h-11 cursor-pointer py-3 text-xs text-muted-foreground">{t("Fler val")}</summary>
                <label className="block text-xs">{t("Svårt att komma igång")}
                  <select aria-label={`${t("Svårighetsgrad för")} ${entry.title}`} value={entry.friction ?? ""} disabled={busy || loadingDay}
                    onChange={(event) => void run(() => updateFactor(entry.id, { friction: event.target.value === "" ? null : Number(event.target.value) }))}
                    className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-2 text-sm">
                    <option value="">{t("Inte registrerat")}</option>
                    {FRICTION_LEVELS.map((friction) => <option key={friction.value} value={friction.value}>{t(friction.label)}</option>)}
                  </select>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" disabled={busy || loadingDay} className="min-h-11 h-auto whitespace-normal" onClick={() => void run(() => toggleCounts(entry.id, !entry.countsTowardScore))}>{entry.countsTowardScore ? t("Räkna inte med") : t("Räkna med")}</Button>
                  <Button variant="ghost" disabled={busy || loadingDay} className="min-h-11" aria-label={`${t("Ta bort")} ${entry.title}`} onClick={() => void run(() => removeFactor(entry.id))}><Trash2 size={15} /> {t("Ta bort")}</Button>
                </div>
              </details>
              {entry.note && <p className="break-words text-xs text-muted-foreground">{entry.note}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t("Ändringar här rättar energihistoriken. De ändrar inte dagens batteri.")}</p>
    </MyFloveBlock>
  );
}
