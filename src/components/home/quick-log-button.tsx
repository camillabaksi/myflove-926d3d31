import { useState } from "react";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { ORK_LEVELS, orkFromValue10 } from "@/lib/ork";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Liten direktloggning på Hem: ett tryck på Låg/Mellan/God sparar direkt
 * (samma data som Mitt batteri – useQuickCheckin + kapacitetsläge).
 * Ingen ny datamodell, inget extra steg.
 */
export default function QuickLogButton() {
  const { t } = useLang();
  const { energyValue, logEnergy } = useQuickCheckin();
  const { setMode } = useCapacityMode();
  const [saved, setSaved] = useState(false);

  const current = orkFromValue10(energyValue ?? null);

  const log = (value10: number, modeId: string) => {
    void logEnergy(value10);
    setMode(modeId as "lagt" | "mellan" | "god");
    track("battery_logged", { source: "hem-snabb", method: "ork" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section
      aria-label={t("Logga läget direkt")}
      data-testid="home-quick-log"
      className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          <span aria-hidden>🔋</span> {t("Hur är läget?")}
        </p>
        <span aria-live="polite" className="text-xs font-medium text-primary">
          {saved ? (
            <span className="inline-flex items-center gap-1">
              <Check size={13} aria-hidden /> {t("Sparat")}
            </span>
          ) : current ? (
            t(current.label)
          ) : null}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {ORK_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            aria-pressed={current?.id === level.id}
            onClick={() => log(level.value10, level.id)}
            className={cn(
              "press flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border text-sm font-medium transition-all",
              current?.id === level.id
                ? "border-primary bg-primary/10 text-ink"
                : "border-border/60 bg-card text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            <span aria-hidden>{level.dot}</span>
            {t(level.label)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link href="/mitt-batteri" className="underline underline-offset-2">
          {t("Mer om din energi och dina mönster")}
        </Link>
      </p>
    </section>
  );
}
