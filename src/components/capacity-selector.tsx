import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useLang } from "@/hooks/use-language";
import { CAPACITY_META, type CapacityMode } from "@/lib/priority-engine";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const MODES: CapacityMode[] = ["fullt", "mellan", "lagt"];
/** Samma energivärden som ork-nivåerna – valet loggas även som dagens ork. */
const VALUE10: Record<CapacityMode, number> = { fullt: 9, mellan: 6, lagt: 3 };

const TONE: Record<CapacityMode, { dot: string; activeBg: string; activeBorder: string; activeText: string; activeRing: string }> = {
  fullt: {
    dot: "bg-sage",
    activeBg: "bg-sage/12",
    activeBorder: "border-sage/50",
    activeText: "text-ink",
    activeRing: "ring-sage/25",
  },
  mellan: {
    dot: "bg-gold",
    activeBg: "bg-gold/15",
    activeBorder: "border-gold/60",
    activeText: "text-ink",
    activeRing: "ring-gold/30",
  },
  lagt: {
    dot: "bg-terracotta",
    activeBg: "bg-terracotta/12",
    activeBorder: "border-terracotta/50",
    activeText: "text-ink",
    activeRing: "ring-terracotta/25",
  },
};

export default function CapacitySelector({
  className,
  title = "Hur är läget idag?",
  showHelper = true,
}: {
  className?: string;
  title?: string;
  showHelper?: boolean;
}) {
  const { t } = useLang();
  const { mode, setMode } = useCapacityMode();
  const { logEnergy } = useQuickCheckin();

  const choose = (item: CapacityMode) => {
    setMode(item);
    void logEnergy(VALUE10[item]);
    track("battery_logged", { source: "kapacitet", method: "ork" });
  };

  return (
    <section className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-soft", className)}>
      <p className="font-display text-lg font-bold text-ink">{t(title)}</p>
      {showHelper && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("Jag anpassar planen efter hur mycket som får plats idag.")}
        </p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label={t(title)}>
        {MODES.map((item) => {
          const active = mode === item;
          const tone = TONE[item];
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(item)}
              className={cn(
                "flex min-h-[4.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 px-2 py-3 transition-all active:scale-[0.97]",
                active
                  ? cn("border-2 shadow-soft ring-4", tone.activeBg, tone.activeBorder, tone.activeRing)
                  : "border-border/50 bg-muted/30 hover:bg-muted/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-4 w-4 rounded-full transition-shadow",
                  tone.dot,
                  active ? "ring-4 ring-white/70" : "opacity-70",
                )}
              />
              <span
                className={cn(
                  "truncate text-[13px]",
                  active ? "font-bold" : "font-semibold text-muted-foreground",
                )}
              >
                {t(CAPACITY_META[item].label)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-medium text-ink/80" aria-live="polite">
        {t(CAPACITY_META[mode].meaning)}
      </p>
    </section>
  );
}
