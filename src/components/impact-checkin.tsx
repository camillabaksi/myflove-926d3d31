import { useEffect, useState } from "react";
import { CloudRain } from "lucide-react";
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
export default function ImpactCheckin() {
  const { t } = useLang();
  const { impact, logImpact, clearImpact } = useImpactCheckin();
  const [kinds, setKinds] = useState<ImpactKind[]>(impact?.kinds ?? []);
  const [degree, setDegree] = useState<ImpactDegree | null>(impact?.degree ?? null);
  const [timing, setTiming] = useState<ImpactTiming>(impact?.timing ?? "nu");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (impact) {
      setKinds(impact.kinds);
      setDegree(impact.degree);
      setTiming(impact.timing ?? "nu");
    }
  }, [impact]);

  const toggle = (id: ImpactKind) => {
    setKinds((prev) => {
      if (id === "inget") return prev.includes("inget") ? [] : ["inget"];
      const without = prev.filter((k) => k !== "inget");
      return without.includes(id) ? without.filter((k) => k !== id) : [...without, id];
    });
  };

  const onlyNothing = kinds.length > 0 && kinds.every((k) => k === "inget");

  const save = () => {
    if (!kinds.length) return;
    logImpact(kinds, degree ?? "lite", timing);
    track("impact_logged", { source: "mitt-batteri" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const remove = () => {
    clearImpact();
    setKinds([]);
    setDegree(null);
    setTiming("nu");
  };

  const summary = impact
    ? impact.kinds
        .map((k) => {
          const o = impactOption(k);
          return o ? `${o.emoji} ${t(o.labelSv)}` : null;
        })
        .filter(Boolean)
        .join(" · ")
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

  return (
    <ExpandableBlock
      title={t("Vad påverkar din kapacitet?")}
      titleText={t("Vad påverkar din kapacitet?")}
      subtitle={t("Frivilligt – det hjälper Flow att anpassa dagen.")}
      summary={summary}
      icon={CloudRain}
      tone="blush"
      surface="blush"
      area="halsa"
      data-testid="impact-checkin"
    >
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
                    onClick={() => setTiming(tm.id)}
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
                    onClick={() => setDegree(d.id)}
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
            : t("Påverkan ändrar inte din batterinivå – den ger Flow sammanhang.")}
        </p>
      </div>
    </ExpandableBlock>
  );
}
