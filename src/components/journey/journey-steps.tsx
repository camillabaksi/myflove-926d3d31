import { Link } from "wouter";
import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { useDayJourney } from "@/hooks/use-day-journey";
import type { JourneyStepId } from "@/lib/day-journey";
import { cn } from "@/lib/utils";
import { useNpfSettings } from "@/lib/npf-mode";
import { useCollapsible } from "@/lib/collapse-store";

interface JourneyStepsProps {
  onAddOpen?: () => void;
}

interface StepDef {
  id: JourneyStepId;
  number: string;
  emoji: string;
  title: string;
  body: string;
  simpleBody: string;
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
    simpleBody: "Känn efter hur du mår och hur mycket du orkar.",
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
    simpleBody: "Se dagens saker eller lägg till något nytt.",
    cta: "Planera dagen",
    href: "/idag",
    event: "step2_opened",
  },
  {
    id: "planera",
    number: "03",
    emoji: "🌿",
    title: "Behöver du planera om?",
    body: "MyFlove hjälper dig att anpassa dagen – flytta, förenkla eller hitta nästa rimliga steg.",
    simpleBody: "Ändra dagen om den känns för tung.",
    cta: "Hjälp mig planera om",
    href: "/flowplan",
    event: "step3_opened",
  },
];

function JourneyStep({
  step,
  onAddOpen,
  simple,
}: {
  step: StepDef;
  onAddOpen?: () => void;
  simple: boolean;
}) {
  const { t } = useLang();
  const { steps, needsReplan } = useDayJourney();
  const { collapsed, toggle } = useCollapsible(`home-journey-${step.id}`);
  const status = steps[step.id];
  const highlight = step.id === "planera" && needsReplan;
  const isHander = step.id === "hander";

  return (
    <section
      data-testid={`journey-step-${step.id}`}
      aria-label={`${step.number} ${t(step.title)}`}
      data-expanded={!collapsed}
      className={cn(
        "rounded-3xl border bg-card p-5 shadow-soft",
        highlight ? "border-primary/60 bg-lavender/25" : "border-border/60",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Öppna ${t(step.title)}` : `Minimera ${t(step.title)}`}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          aria-hidden
          className="text-xs font-semibold tabular-nums tracking-widest text-primary"
        >
          {step.number}
        </span>
        <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">
          <span aria-hidden>{step.emoji}</span> {t(step.title)}
        </h2>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </button>

      {!collapsed && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(simple ? step.simpleBody : step.body)}
          </p>
          <ul className="mt-3 space-y-1">
            {(simple ? status.lines.slice(0, 1) : status.lines).map((line) => (
              <li key={line} className="text-sm text-ink">
                {t(line)}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={step.href}
              onClick={() => track(step.event, { source: "hem" })}
              className={cn(
                "press inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
                highlight || !status.complete
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-ink hover:border-primary",
              )}
            >
              {t(step.cta)} <ArrowRight size={15} aria-hidden />
            </Link>
            {isHander && onAddOpen && (
              <button
                type="button"
                data-testid="home-add"
                onClick={() => {
                  track("add_opened", { source: "hem-steg2" });
                  onAddOpen();
                }}
                className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-ink hover:border-primary"
              >
                <Plus size={16} aria-hidden /> {t("Lägg till")}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Dagens tre steg – MyFloves primära väg.
 * Varje steg leder in i funktioner som redan finns; korten lägger bara
 * en tydlig ordning och en lugn status ovanpå.
 */
export default function JourneySteps({ onAddOpen }: JourneyStepsProps) {
  const { settings: npf } = useNpfSettings();

  return (
    <div className="space-y-3" data-testid="home-journey">
      {STEPS.map((step) => (
        <JourneyStep key={step.id} step={step} onAddOpen={onAddOpen} simple={npf.less} />
      ))}
    </div>
  );
}
