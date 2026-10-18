import { useEffect, useId, useState } from "react";
import { ChevronDown, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyFloveIcon } from "@/components/myflove";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import {
  IMPACT_DEGREES,
  IMPACT_GROUPS,
  IMPACT_NOTHING,
  IMPACT_TIMINGS,
  impactOption,
  type ImpactDegree,
  type ImpactKind,
  type ImpactTiming,
} from "@/lib/impact-checkin";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * Vad påverkar din kapacitet? – diskret, frivillig registrering direkt under
 * batteriet. Kropp & hälsa, känslor & tankar, omgivning + grad. Ändrar aldrig
 * batteriprocenten; den är enbart kontext till Flow.
 */
export interface CalendarImpactDraft {
  kinds: ImpactKind[];
  degree: ImpactDegree | null;
  timing: ImpactTiming;
  open: boolean;
  dirty: boolean;
}

export default function ImpactCheckin({ calendarMobile = false, compact = false, draft, onDraftChange }: {
  calendarMobile?: boolean;
  compact?: boolean;
  draft?: CalendarImpactDraft | null;
  onDraftChange?: (draft: CalendarImpactDraft) => void;
} = {}) {
  const { t } = useLang();
  const { impact, logImpact, clearImpact } = useImpactCheckin();
  const [kinds, setKinds] = useState<ImpactKind[]>(draft?.kinds ?? impact?.kinds ?? []);
  const [degree, setDegree] = useState<ImpactDegree | null>(draft?.degree ?? impact?.degree ?? null);
  const [timing, setTiming] = useState<ImpactTiming>(draft?.timing ?? impact?.timing ?? "nu");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(draft?.open ?? false);
  const [mobile, setMobile] = useState(false);
  const contentId = useId();

  useEffect(() => {
    if (!calendarMobile) return;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [calendarMobile]);

  const remember = (changes: Partial<CalendarImpactDraft>) => {
    onDraftChange?.({ kinds, degree, timing, open, dirty: draft?.dirty ?? false, ...changes });
  };

  useEffect(() => {
    if (impact && !draft?.dirty) {
      setKinds(impact.kinds);
      setDegree(impact.degree);
      setTiming(impact.timing ?? "nu");
    }
  }, [impact, draft?.dirty]);

  const toggle = (id: ImpactKind) => {
    const without = kinds.filter((k) => k !== "inget");
    const next: ImpactKind[] = id === "inget"
      ? (kinds.includes("inget") ? [] : ["inget"])
      : (without.includes(id) ? without.filter((k) => k !== id) : [...without, id]);
    setKinds(next);
    remember({ kinds: next, dirty: true });
  };

  const onlyNothing = kinds.length > 0 && kinds.every((k) => k === "inget");

  const save = () => {
    if (!kinds.length) return;
    logImpact(kinds, degree ?? "lite", timing);
    remember({ dirty: false });
    track("impact_logged", { source: "mitt-batteri" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const remove = () => {
    clearImpact();
    setKinds([]);
    setDegree(null);
    setTiming("nu");
    remember({ kinds: [], degree: null, timing: "nu", dirty: false });
  };

  const summary = impact
    ? `${impact.kinds
        .map((k) => {
          const o = impactOption(k);
          return o ? `${o.emoji} ${t(o.labelSv)}` : null;
        })
        .filter(Boolean)
        .join(" · ")} · ${t(
        IMPACT_TIMINGS.find((tm) => tm.id === (impact.timing ?? "nu"))!.labelSv,
      )}`
    : t("Lägg till om något påverkar dig idag.");

  const chip = (id: ImpactKind, emoji: string, label: string) => {
    const on = kinds.includes(id);
    return (
      <button
        key={id}
        type="button"
        aria-pressed={on}
        onClick={() => toggle(id)}
        className={cn(
          "min-h-11 rounded-pill border px-3 py-1.5 text-left text-sm transition-all",
          on
            ? "border-primary bg-primary/10 text-ink"
            : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
        )}
      >
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {label}
      </button>
    );
  };

  const form = (
      <div className="space-y-4">
        {IMPACT_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(group.titleSv)}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((o) => chip(o.id, o.emoji, t(o.labelSv)))}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
          {chip(IMPACT_NOTHING.id, IMPACT_NOTHING.emoji, t(IMPACT_NOTHING.labelSv))}
        </div>

        {kinds.length > 0 && !onlyNothing && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t("Påverkar det dig nu, eller har det påverkat dig?")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {IMPACT_TIMINGS.map((tm) => {
                const on = timing === tm.id;
                return (
                  <button
                    key={tm.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => { setTiming(tm.id); remember({ timing: tm.id, dirty: true }); }}
                    className={cn(
                      "min-h-11 rounded-2xl border px-3 py-2 text-sm font-medium transition-all",
                      on
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(tm.labelSv)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kinds.length > 0 && !onlyNothing && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t("Hur mycket påverkar det dig just nu?")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {IMPACT_DEGREES.map((d) => {
                const on = degree === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => { setDegree(d.id); remember({ degree: d.id, dirty: true }); }}
                    className={cn(
                      "min-h-11 rounded-2xl border px-3 py-2 text-sm font-medium transition-all",
                      on
                        ? "border-primary bg-primary/10 text-ink"
                        : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(d.labelSv)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kinds.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={save}
              disabled={!onlyNothing && !degree}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saved ? t("Tack – sparat") : t("Spara påverkan")}
            </button>
            {impact && (
              <button
                type="button"
                onClick={remove}
                className="min-h-11 rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t("Ta bort")}
              </button>
            )}
          </div>
        )}

        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {impact && !saved
            ? t("Sparat för idag – du kan ändra eller ta bort när du vill.")
            : t(
                "Påverkan ändrar aldrig batteriet automatiskt – men batteriet kan föreslå en lägre nivå som du själv godkänner.",
              )}
        </p>
      </div>
  );

  if (compact) {
    return (
      <section data-testid="impact-checkin" data-expanded={open} className="min-w-0 border-t border-[#EDE5E9] pt-1">
        <button type="button" aria-expanded={open} aria-controls={contentId}
          onClick={() => setOpen(!open)}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-1 py-2 text-left text-sm text-[#512654] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#512654]">
          <CloudRain size={17} aria-hidden className="shrink-0 text-[#87668B]" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{t("Vad påverkar mig idag?")}</span>
            {!open && <span className="block text-xs text-muted-foreground">{summary || t("Frivilligt · Tryck för att lägga till")}</span>}
          </span>
          <ChevronDown size={17} aria-hidden className={cn("shrink-0 text-[#512654] transition-transform", open && "rotate-180")} />
        </button>
        <div id={contentId} hidden={!open} className="min-w-0 px-1 pb-3 pt-2">
          <p className="mb-3 text-xs text-muted-foreground">{t("Frivilligt – hjälper Paceable att förstå vad som påverkar din dag.")}</p>
          {form}
        </div>
      </section>
    );
  }

  if (calendarMobile && mobile) {
    return (
      <section data-testid="impact-checkin" data-expanded={open} className="pace-calendar-mobile-impact min-w-0 rounded-3xl border border-border/60 bg-blush/50 shadow-soft">
        <Button type="button" variant="ghost" aria-expanded={open} aria-controls={contentId}
          onClick={() => { setOpen(!open); remember({ open: !open }); }}
          className="grid h-auto min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 whitespace-normal rounded-3xl px-3 py-3 text-left focus-visible:ring-2 focus-visible:ring-ring">
          <MyFloveIcon icon={CloudRain} tone="blush" size="sm" className="shrink-0" />
          <span className="min-w-0 break-words">
            <span className="block text-sm font-semibold leading-snug text-ink">{t("Vad påverkar din kapacitet?")}</span>
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">{t("Lägg till vid behov")}</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" className={cn("shrink-0 text-muted-foreground", open && "rotate-180")} />
        </Button>
        <div id={contentId} hidden={!open} className="min-w-0 border-t border-border/50 p-3">
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t("Frivilligt – hjälper Paceable att förstå vad som påverkar din dag.")}</p>
          {form}
        </div>
      </section>
    );
  }

  return (
    <ExpandableBlock title={t("Vad påverkar din kapacitet?")} titleText={t("Vad påverkar din kapacitet?")}
      subtitle={t("Frivilligt – hjälper Paceable att förstå vad som påverkar din dag.")}
      summary={summary} icon={CloudRain} tone="blush" surface="blush" area="halsa" data-testid="impact-checkin">
      {form}
    </ExpandableBlock>
  );
}
