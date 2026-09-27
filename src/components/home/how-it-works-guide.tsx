import { useState } from "react";
import { Link } from "wouter";
import {
  Brain,
  BatteryMedium,
  Sparkles,
  CalendarDays,
  Leaf,
  ChevronDown,
  ArrowRight,
  ArrowDown,
  Heart,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Step {
  n: number;
  kicker: string;
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}

/**
 * "Så funkar MyFlove" – en liten visuell karta längst ner på Hem.
 * Hopfälld som standard; VISA → KLICKA → FÖRDJUPA.
 */
export default function HowItWorksGuide() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const steps: Step[] = [
    {
      n: 1,
       kicker: t("Fånga"),
      title: "QuickFlow",
       text: t("Skriv ner det som snurrar."),
      href: "/quickflow",
      icon: Brain,
      tone: "bg-accent/40",
    },
    {
      n: 2,
       kicker: t("Förstå"),
      title: t("Mitt batteri"),
       text: t("Känn efter hur mycket ork du har."),
      href: "/mitt-batteri",
      icon: BatteryMedium,
      tone: "bg-secondary/60",
    },
    {
      n: 3,
       kicker: t("Anpassa"),
      title: "Flow",
       text: t("Få hjälp att hitta nästa steg."),
      href: "/flow",
      icon: Sparkles,
      tone: "bg-primary/10",
    },
    {
      n: 4,
       kicker: t("Gör"),
      title: t("Min dag"),
       text: t("Se möten och vardagssaker på samma plats."),
      href: "/idag",
      icon: CalendarDays,
      tone: "bg-accent/30",
    },
    {
      n: 5,
       kicker: t("Återhämta"),
      title: t("Återhämtning"),
       text: t("Pausa när du behöver."),
      href: "/aterhamtning",
      icon: Leaf,
      tone: "bg-secondary/50",
    },
  ];

  const card = (s: Step, center = false) => (
    <div
      key={s.n}
       className={cn(
         "relative flex min-w-0 flex-col items-center rounded-3xl border border-border/60 p-3 text-center shadow-soft",
        s.tone,
        center && "sm:px-6",
      )}
    >
      <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {s.n}
      </span>
      {center ? (
        <FlowMascot size="md" mood="calm" alt="" />
      ) : (
        <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-card/80">
          <s.icon className="h-5 w-5 text-primary" aria-hidden />
        </span>
      )}
      <p className="mt-2 text-xs font-medium text-muted-foreground">{s.kicker}</p>
      <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
      <Link
        href={s.href}
        onClick={() => track("home_widget_opened", { source: `guide-${s.n}` })}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
      >
        {t("Öppna")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );

  const arrow = <ArrowDown className="mx-auto h-4 w-4 text-primary/50 sm:hidden" aria-hidden />;

  return (
    <section
      data-testid="home-how-it-works"
      className="rounded-3xl border border-border/60 bg-card/70 shadow-soft"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-auto w-full items-center justify-start gap-3 rounded-3xl p-4 text-left"
      >
        <FlowMascot size="sm" mood="calm" alt="" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold text-ink">
            {t("Ny på MyFlove?")}
          </span>
          <span className="block text-sm text-muted-foreground">{t("Så funkar det")} →</span>
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </Button>

      {open && (
        <div className="animate-fade-in space-y-3 px-4 pb-5">
          <p className="text-center text-xs font-semibold uppercase text-primary">
            {t("Fånga → Förstå → Anpassa → Göra → Återhämta")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {card(steps[0])}
            {arrow}
            {card(steps[1])}
          </div>
          {arrow}
          <div className="mx-auto sm:max-w-sm">{card(steps[2], true)}</div>
          {arrow}
          <div className="grid gap-3 sm:grid-cols-2">
            {card(steps[3])}
            {arrow}
            {card(steps[4])}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-accent/40 p-4">
            <Heart className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-ink">
              {t("Du behöver inte använda allt. Börja där du är just nu.")}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-xs text-muted-foreground">
              {t("Tips! Du kan alltid fråga Flow om du inte vet var du ska börja.")}
            </p>
          </div>
          <Button asChild className="w-full rounded-2xl">
            <Link href="/flow" onClick={() => track("home_widget_opened", { source: "guide-ask-flow" })}>
              {t("Fråga Flow")} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Link
            href="/oversikt"
            onClick={() => track("home_widget_opened", { source: "guide-overview" })}
            className="block text-center text-xs font-medium text-primary underline underline-offset-2"
          >
            {t("Se allt som finns i MyFlove")}
          </Link>
        </div>
      )}
    </section>
  );
}
