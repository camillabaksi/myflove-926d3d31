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
 * (en eller flera påverkningar + grad) som sparas med dagen och ges till
 * Flow som kontext. Ändrar aldrig batterinivån.
 */
export default function ImpactCheckin() {
  const { t } = useLang();
  const { impact, logImpact } = useImpactCheckin();
  const [kinds, setKinds] = useState<ImpactKind[]>(impact?.kinds ?? []);
  const [degree, setDegree] = useState<ImpactDegree | null>(impact?.degree ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (impact) {
      setKinds(impact.kinds);
      setDegree(impact.degree);
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
    logImpact(kinds, degree ?? "lite");
    track("impact_logged", { source: "mitt-batteri" });
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
            const on = kinds.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
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

        {kinds.length > 0 && !onlyNothing && (
...
        {kinds.length > 0 && (
          <button
            type="button"
            onClick={save}
            disabled={!onlyNothing && !degree}
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
