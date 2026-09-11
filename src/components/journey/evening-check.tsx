import { useMemo } from "react";
import { useLang } from "@/hooks/use-language";
import { useEveningCheck } from "@/hooks/use-evening-check";
import { useDayJourney } from "@/hooks/use-day-journey";
import { EVENING_ANSWERS, eveningReply } from "@/lib/day-journey";
import { buildEveningInsight } from "@/lib/evening-insight";
import { track } from "@/lib/analytics";
import { ChevronDown } from "lucide-react";
import { useCollapsible } from "@/lib/collapse-store";
import { cn } from "@/lib/utils";

/**
 * 🌙 Hur blev dagen? – frivillig och klar på ett tryck.
 * Svaret sparas tillsammans med dagens ork, batteri och antal saker, så att
 * MyFlove kan visa sambandet mellan förväntad och faktisk dag.
 */
export default function EveningCheck() {
  const { t } = useLang();
  const { evening, eveningHistory, logEvening } = useEveningCheck();
  const { input } = useDayJourney();
  const { collapsed, toggle } = useCollapsible("home-evening-check");

  const insight = useMemo(
    () => buildEveningInsight(eveningHistory, evening),
    [eveningHistory, evening],
  );

  return (
    <section
      aria-label={t("Hur blev dagen?")}
      data-testid="home-evening-check"
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
    >
      <button type="button" onClick={toggle} aria-expanded={!collapsed} className="flex w-full items-center gap-2 text-left">
        <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">
          <span aria-hidden>🌙</span> {t("Hur blev dagen?")}
        </h2>
        <ChevronDown size={18} className={cn("text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
      </button>

      {!collapsed && (evening ? (
        <p className="mt-2 text-sm text-muted-foreground">{t(eveningReply(evening.answer))}</p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t("Helt frivilligt – ett tryck räcker.")}</p>
      ))}

      {!collapsed && <div className="mt-3 flex flex-wrap gap-2">
        {EVENING_ANSWERS.map((option) => {
          const active = evening?.answer === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                logEvening(option.id, {
                  ork10: input.ork10,
                  battery: input.batteryNow,
                  planned: input.planned,
                  done: input.done,
                  openThoughts: input.openThoughts,
                });
                track("evening_check_completed", { source: "hem", method: option.id });
              }}
              className={`press min-h-11 rounded-full px-4 text-sm font-medium ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-ink hover:border-primary"
              }`}
            >
              <span aria-hidden>{option.emoji}</span> {t(option.label)}
            </button>
          );
        })}
      </div>}

      {!collapsed && (insight.todayLine || insight.patternLine) && (
        <div className="mt-4 rounded-2xl bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("Förväntat och faktiskt")}
          </p>
          {insight.todayLine && <p className="mt-1 text-sm text-ink">{t(insight.todayLine)}</p>}
          {insight.patternLine && (
            <p className="mt-1 text-sm text-muted-foreground">{t(insight.patternLine)}</p>
          )}
        </div>
      )}
    </section>
  );
}
