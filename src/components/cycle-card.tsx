import { useEffect, useState } from "react";
import { Flower2, Trash2 } from "lucide-react";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import { useCycle } from "@/hooks/use-cycle";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { cyclePatterns, energyByDay, impactPatterns } from "@/lib/capacity-patterns";
import {
  CYCLE_SYMPTOMS,
  PHASE_LABEL_SV,
  PHASE_ORDER,
  cycleIndicator,
  dayKey,
  periodRangeFor,
  periodStarts,
  type CycleSymptom,
} from "@/lib/cycle";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * Menscykel – visas bara när användaren själv har aktiverat funktionen
 * under Min profil. Enkel registrering, en uppskattad tidslinje och
 * användarens egna mönster. Inga medicinska påståenden.
 */
export default function CycleCard() {
  const { t } = useLang();
  const {
    cycle,
    status,
    todaySymptoms,
    currentPeriod,
    setUseInFlow,
    togglePeriodDay,
    setPeriodRange,
    removePeriodRange,
    setSymptoms,
  } = useCycle();
  const [start, setStart] = useState(() => currentPeriod?.start ?? dayKey());
  const [end, setEnd] = useState(() => currentPeriod?.end ?? dayKey());

  useEffect(() => {
    if (currentPeriod) {
      setStart(currentPeriod.start);
      setEnd(currentPeriod.end);
    }
  }, [currentPeriod?.start, currentPeriod?.end]);
  const { impactHistory } = useImpactCheckin();
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);

  if (!cycle.enabled) return null;

  const today = dayKey();
  const isPeriodToday = cycle.periodDays.includes(today);
  const byDay = energyByDay(energyLog ?? []);
  const patterns = [...cyclePatterns(cycle, byDay), ...impactPatterns(impactHistory, byDay)];
  const indicator = cycleIndicator(status);
  const registeredPeriods = periodStarts(cycle.periodDays)
    .slice(0, 3)
    .map((d) => periodRangeFor(cycle.periodDays, d))
    .filter((p): p is { start: string; end: string } => p !== null);

  const toggleSymptom = (id: CycleSymptom) => {
    setSymptoms(
      todaySymptoms.includes(id) ? todaySymptoms.filter((s) => s !== id) : [...todaySymptoms, id],
    );
  };

  return (
    <ExpandableBlock
      title={t("Menscykel")}
      titleText={t("Menscykel")}
      subtitle={t("Frivilligt – bara för dig som vill följa din cykel.")}
      summary={
        indicator
          ? `🌸 ${t(indicator.split(" · ")[1] ?? "")} · ${indicator.split(" · ")[0]}`
          : t("Registrera när mensen börjar för att komma igång.")
      }
      icon={Flower2}
      tone="blush"
      surface="blush"
      area="halsa"
      data-testid="cycle-card"
    >
      <div className="space-y-4">
        <div className="space-y-2 rounded-2xl border border-border/60 bg-card/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Välj vilka dagar mensen varade")}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="flex-1 min-w-[9rem] text-xs text-muted-foreground">
              {t("Började")}
              <input
                type="date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
            <label className="flex-1 min-w-[9rem] text-xs text-muted-foreground">
              {t("Slutade")}
              <input
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setPeriodRange(start, end)}
            className="min-h-11 w-full rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-ink transition-all hover:bg-primary/15"
          >
            {t("Spara mensperiod")}
          </button>
          {registeredPeriods.length > 0 && (
            <ul className="space-y-1 pt-1">
              {registeredPeriods.map((p) => (
                <li
                  key={p.start}
                  className="flex items-center justify-between gap-2 text-sm text-ink"
                >
                  <span>
                    {p.start} – {p.end}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePeriodRange(p.start, p.end)}
                    aria-label={t("Ta bort period")}
                    className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => togglePeriodDay()}
          className={cn(
            "min-h-11 w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
            isPeriodToday
              ? "border-primary bg-primary/10 text-ink"
              : "border-border/60 bg-card/70 text-ink hover:bg-muted/40",
          )}
        >
          {isPeriodToday ? t("Mensdag idag – tryck för att ta bort") : t("Markera mensdag idag")}
        </button>

        {status && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {PHASE_ORDER.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "rounded-pill border px-2.5 py-1 text-xs",
                    status.phase === p
                      ? "border-primary bg-primary/10 font-semibold text-ink"
                      : "border-border/60 text-muted-foreground",
                  )}
                >
                  {t(PHASE_LABEL_SV[p])}
                </span>
              ))}
            </div>
            <p className="text-sm text-ink">
              {t("Du är ungefär på")}{" "}
              <strong>
                {t("dag")} {status.day}
              </strong>{" "}
              {t("av en uppskattad cykel på")} {status.length} {t("dagar")}.
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Fas och ägglossning är uppskattningar och varierar mellan personer och mellan cykler. Paceable säger inget om hur du bör må.",
              )}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Något du märker idag?")}
          </p>
          <div className="flex flex-wrap gap-2">
            {CYCLE_SYMPTOMS.map((s) => {
              const on = todaySymptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSymptom(s.id)}
                  className={cn(
                    "min-h-11 rounded-pill border px-3 py-1.5 text-sm transition-all",
                    on
                      ? "border-primary bg-primary/10 text-ink"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span aria-hidden className="mr-1">
                    {s.emoji}
                  </span>
                  {t(s.labelSv)}
                </button>
              );
            })}
          </div>
        </div>

        {patterns.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-border/60 bg-card/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Möjliga mönster i din egen data")}
            </p>
            <ul className="space-y-1 text-sm text-ink">
              {patterns.map((p) => (
                <li key={p.id}>• {t(p.textSv)}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {t("Vill du att Pace tar hänsyn till detta när du planerar?")}
              </p>
              <div className="flex gap-1.5">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={cycle.useInFlow === v}
                    onClick={() => setUseInFlow(v)}
                    className={cn(
                      "min-h-9 rounded-pill border px-3 py-1 text-xs font-medium",
                      cycle.useInFlow === v
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {v ? t("Ja") : t("Nej")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExpandableBlock>
  );
}
