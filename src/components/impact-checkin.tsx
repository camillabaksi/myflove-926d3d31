import { useEffect, useState } from "react";
import { CloudRain } from "lucide-react";
import { MyFloveBlock } from "@/components/myflove/block";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import {
  IMPACT_DEGREES,
  IMPACT_OPTIONS,
  type ImpactDegree,
  type ImpactKind,
} from "@/lib/impact-checkin";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * Påverkan – vad som belastar kapaciteten just nu. Enkel registrering
 * (en påverkan + grad) som sparas med dagen och ges till Flow som kontext.
 * Ändrar aldrig batterinivån.
 */
export default function ImpactCheckin() {
  const { t } = useLang();
  const { impact, logImpact } = useImpactCheckin();
  const [kind, setKind] = useState<ImpactKind | null>(impact?.kind ?? null);
  const [degree, setDegree] = useState<ImpactDegree | null>(impact?.degree ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (impact) {
      setKind(impact.kind);
      setDegree(impact.degree);
    }
  }, [impact]);

  const save = () => {
    if (!kind || !degree) return;
    logImpact(kind, degree);
    track("impact_logged", { source: "mitt-batteri", kind, degree });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <MyFloveBlock
      title={t("Påverkan")}
      subtitle={t("Något som tynger just nu? Det hjälper Flow anpassa dagen.")}
      icon={CloudRain}
      tone="blush"
      surface="blush"
      area="halsa"
      data-testid="impact-checkin"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {IMPACT_OPTIONS.map((o) => {
            const on = kind === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(o.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-sm transition-all",
                  on
                    ? "border-primary bg-primary/10 text-ink"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden className="mr-1">
                  {o.emoji}
                </span>
                {t(o.labelSv)}
              </button>
            );
          })}
        </div>

        {kind && kind !== "inget" && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t("Hur mycket påverkar det dig?")}</p>
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

        {kind && (
          <button
            type="button"
            onClick={save}
            disabled={kind !== "inget" && !degree}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saved ? t("Tack – sparat") : t("Spara påverkan")}
          </button>
        )}

        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {impact && !saved
            ? t("Sparat för idag – du kan ändra när du vill.")
            : t("Påverkan ändrar inte din batterinivå – den ger Flow sammanhang.")}
        </p>
      </div>
    </MyFloveBlock>
  );
}
