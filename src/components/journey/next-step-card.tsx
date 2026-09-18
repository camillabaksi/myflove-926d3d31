import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import AdaptiveIntentPrompt from "@/components/adaptive-intent-prompt";
import { useLang } from "@/hooks/use-language";
import { useTasks } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { suggestNow } from "@/lib/flow-engine";
import { LOW_ORK_MAX } from "@/lib/day-journey";
import { track } from "@/lib/analytics";
import { useCollapsible } from "@/lib/collapse-store";
import { cn } from "@/lib/utils";

/**
 * 🌿 Nästa rimliga steg – ETT förslag i taget, aldrig en lista.
 * Bygger på befintlig Flow-motor och befintliga uppgifter.
 */
export default function NextStepCard() {
  const { t } = useLang();
  const { activeTasks } = useTasks();
  const { reading } = useEnergyBattery();
  const { energyValue } = useQuickCheckin();
  const [smaller, setSmaller] = useState(false);
  const { collapsed, toggle } = useCollapsible("home-next-step");
  const { flow } = useFlowScore();

  const battery = Math.round(reading.now);
  const lowOrk = energyValue != null && energyValue <= LOW_ORK_MAX;
  /** FlowScore och nästa steg hör ihop – men steget funkar även utan score. */
  const flowScore = typeof flow?.score === "number" ? Math.round(flow.score) : null;

  const suggestion = useMemo(
    () =>
      suggestNow({
        tasks: activeTasks,
        batteryNow: lowOrk ? Math.min(battery, 30) : battery,
        availableMinutes: smaller ? 5 : undefined,
      }),
    [activeTasks, battery, lowOrk, smaller],
  );

  return (
    <section
      aria-label={t("Nästa rimliga steg")}
      data-testid="home-next-step"
      className="rounded-3xl border border-border/60 bg-lavender/25 p-5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <FlowMascot size="xs" mood="calm" className="mt-0.5 shrink-0 flow-alive" alt="" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex w-full items-center gap-2 text-left"
          >
            <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">
              {flowScore != null && (
                <span className="mb-0.5 block text-xs font-semibold uppercase text-primary">
                  {t("Ditt Flow")}: {flowScore}
                </span>
              )}
              <span aria-hidden>🌿</span> {t("Nästa rimliga steg")}
            </h2>
            <ChevronDown
              size={18}
              className={cn(
                "text-muted-foreground transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </button>

          {!collapsed && suggestion.task &&
            (lowOrk && !smaller ? (
              <>
                <p className="mt-2 text-sm text-ink">
                  {t("Du har låg energi idag. Vi kan börja mindre.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    track("next_step_shown", { source: "mindre-steg" });
                    setSmaller(true);
                  }}
                  className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                >
                  {t("Visa ett mindre steg")}
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-medium text-ink">{suggestion.task.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {suggestion.reason ||
                    `${t("Det tar ungefär")} ${suggestion.minutes} ${t("minuter och passar din nuvarande energinivå.")}`}
                </p>
                <Link
                  href="/idag"
                  onClick={() => track("next_step_accepted", { source: "hem" })}
                  className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                >
                  {t("Gör detta")} <ArrowRight size={15} aria-hidden />
                </Link>
                {flowScore != null && (
                  <Link
                    href="/flowscore"
                    className="mt-2 block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {t("Varför just detta?")}
                  </Link>
                )}
              </>
            ))}

          {/* Samma kapacitet, men utifrån det DU vill göra just nu. */}
          {!collapsed && (
            <div className="mt-4 border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-ink">
                {t("Vill du göra något annat?")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("Säg vad du vill eller behöver göra, så anpassar jag det efter dagen.")}
              </p>
              <AdaptiveIntentPrompt source="hem" className="mt-3" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
