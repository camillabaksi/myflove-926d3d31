import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { useDayJourney } from "@/hooks/use-day-journey";
import type { JourneyStepId } from "@/lib/day-journey";
import { cn } from "@/lib/utils";

interface StepDef {
  id: JourneyStepId;
  number: string;
  emoji: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  event: "step1_opened" | "step2_opened" | "step3_opened";
}

const STEPS: StepDef[] = [
  {
    id: "mar",
    number: "01",
    emoji: "🔋",
    title: "Hur mår du?",
    body: "Logga ditt mående, din ork och vad som påverkar dig – så förstår vi vad du har kapacitet till idag.",
    cta: "Logga hur du mår",
    href: "/hur-mar-du",
    event: "step1_opened",
  },
  {
    id: "hander",
    number: "02",
    emoji: "📅",
    title: "Vad händer?",
    body: "Planera din dag och få med allt som faktiskt händer – även det osynliga arbetet – så kan vi se hur din energi och dina aktiviteter hänger ihop.",
    cta: "Planera dagen",
    href: "/idag",
    event: "step2_opened",
  },
  {
    id: "planera",
    number: "03",
    emoji: "🌿",
    title: "Behöver du planera om?",
    body: "FlowPlan hjälper dig att anpassa dagen efter din kapacitet – flytta, förenkla eller hitta nästa rimliga steg.",
    cta: "Hjälp mig planera om",
    href: "/flowplan",
    event: "step3_opened",
  },
];

/**
 * Dagens tre steg – MyFloves primära väg.
 * Varje steg leder in i funktioner som redan finns; korten lägger bara
 * en tydlig ordning och en lugn status ovanpå.
 */
export default function JourneySteps() {
  const { t } = useLang();
  const { steps, needsReplan } = useDayJourney();

  return (
    <div className="space-y-3" data-testid="home-journey">
      {STEPS.map((step) => {
        const status = steps[step.id];
        const highlight = step.id === "planera" && needsReplan;
        return (
          <section
            key={step.id}
            data-testid={`journey-step-${step.id}`}
            aria-label={`${step.number} ${t(step.title)}`}
            className={cn(
              "rounded-3xl border bg-card p-5 shadow-soft",
              highlight ? "border-primary/60 bg-lavender/25" : "border-border/60",
            )}
          >
            <div className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="text-xs font-semibold tabular-nums tracking-widest text-primary"
              >
                {step.number}
              </span>
              <h2 className="text-base font-semibold text-ink">
                <span aria-hidden>{step.emoji}</span> {t(step.title)}
              </h2>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.body)}</p>

            <ul className="mt-3 space-y-1">
              {status.lines.map((line) => (
                <li key={line} className="text-sm text-ink">
                  {t(line)}
                </li>
              ))}
            </ul>

            <Link
              href={step.href}
              onClick={() => track(step.event, { source: "hem" })}
              className={cn(
                "press mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
                highlight || !status.complete
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-ink hover:border-primary",
              )}
            >
              {t(step.cta)} <ArrowRight size={15} aria-hidden />
            </Link>
          </section>
        );
      })}
    </div>
  );
}
