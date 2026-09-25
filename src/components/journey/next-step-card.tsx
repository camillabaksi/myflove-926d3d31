import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import AdaptiveIntentPrompt from "@/components/adaptive-intent-prompt";
import { useLang } from "@/hooks/use-language";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { simplifyTask } from "@/lib/priority-engine";
import { track } from "@/lib/analytics";
import { useCollapsible } from "@/lib/collapse-store";
import { cn } from "@/lib/utils";

/**
 * 🌿 Nästa rimliga steg – ETT förslag i taget, aldrig en lista.
 * Visar FlowPlans "Nu" – samma nästa steg som Hem och Flow. Ingen egen
 * rankning, inget batteri.
 */
export default function NextStepCard() {
  const { t } = useLang();
  const plan = useFlowPlan();
  const mode = plan.mode;
  const lowOrk = mode === "lagt";
  const [smaller, setSmaller] = useState(false);
  const { collapsed, toggle } = useCollapsible("home-next-step");

  const now = plan.now;
  const simpler = now ? simplifyTask(now.item.title, mode) : null;
  const suggestion = {
    task: now ? { title: now.item.title } : null,
    reason: smaller && simpler ? simpler : (now?.reason ?? ""),
  };

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
                  {t("Kapacitetsläget är Lågt. Vi kan börja mindre.")}
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
                  {t(suggestion.reason)}
                </p>
                <Link
                  href="/idag"
                  onClick={() => track("next_step_accepted", { source: "hem" })}
                  className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                >
                  {t("Gör detta")} <ArrowRight size={15} aria-hidden />
                </Link>
                {plan.next && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("Sedan:")} {plan.next.item.title}
                  </p>
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
