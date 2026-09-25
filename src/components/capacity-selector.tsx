import { Button } from "@/components/ui/button";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useLang } from "@/hooks/use-language";
import { CAPACITY_META, type CapacityMode } from "@/lib/priority-engine";
import { cn } from "@/lib/utils";

const MODES: CapacityMode[] = ["fullt", "mellan", "lagt"];

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

  return (
    <section className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-soft", className)}>
      <p className="font-display text-base font-bold text-ink">{t(title)}</p>
      {showHelper && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Jag anpassar planen efter hur mycket som får plats idag.")}
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t(title)}>
        {MODES.map((item) => (
          <Button
            key={item}
            type="button"
            variant={mode === item ? "default" : "outline"}
            role="radio"
            aria-checked={mode === item}
            onClick={() => setMode(item)}
            className="min-h-11 min-w-0 rounded-2xl px-2 text-sm font-semibold"
          >
            <span
              aria-hidden
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                item === "fullt" && "bg-sage",
                item === "mellan" && "bg-gold",
                item === "lagt" && "bg-terracotta",
              )}
            />
            <span className="truncate">{t(CAPACITY_META[item].label)}</span>
          </Button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {t(CAPACITY_META[mode].meaning)}
      </p>
    </section>
  );
}