import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Battery, Brain, Heart, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyFlove – Vardagen ska kräva mindre av hjärnan" },
      {
        name: "description",
        content: "MyFlove hjälper dig fånga tankar, planera efter din energi och ta ett steg i taget. Ett mjukare sätt att få vardagen att gå ihop.",
      },
      { property: "og:title", content: "MyFlove – Vardagen ska kräva mindre av hjärnan" },
      {
        property: "og:description",
        content: "Fånga tankar med QuickFlow, planera efter din dagsform och fokusera på nästa rimliga steg.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/" }],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Zap,
    title: "QuickFlow",
    text: "Få ner tankar, uppgifter och idéer innan de försvinner. Flow hjälper dig att sortera resten.",
    accent: "bg-lavender text-primary",
  },
  {
    icon: Battery,
    title: "Planering utifrån energi",
    text: "Dagsformen får styra planen. Välj din kapacitet och se vad som är rimligt just idag.",
    accent: "bg-mint text-foreground",
  },
  {
    icon: Heart,
    title: "Ett steg i taget",
    text: "Mindre stress, mer utrymme. Fokusera på nästa sak istället för att bära hela dagen i huvudet.",
    accent: "bg-blush text-accent-foreground",
  },
] as const;

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hem" });
    });
  }, [navigate]);

  useEffect(() => {
    track("onboarding_started", { source: "intro" });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="relative z-10 border-b border-border/50 bg-card/70">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="MyFlove, startsida" className="flex shrink-0 items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-9 w-9 rounded-xl" />
            <span className="font-display text-xl font-extrabold">MyFlove</span>
          </Link>
          <nav aria-label="Huvudmeny" className="flex items-center gap-2 sm:gap-6">
            <a href="#funktioner" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:inline">Så fungerar det</a>
            <Button asChild variant="ghost" className="px-2 text-sm font-semibold text-foreground hover:text-primary sm:px-4">
              <Link to="/sign-in">Logga in</Link>
            </Button>
            <Button asChild size="lg" className="min-h-10 rounded-full px-4 shadow-soft sm:px-6">
              <Link to="/sign-up">Kom igång</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/50 bg-background">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pt-12 pb-12 sm:px-8 sm:pt-16 lg:min-h-[610px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-12 lg:px-12 lg:py-16">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles aria-hidden="true" className="h-4 w-4" /> En lugnare vardag är möjlig
            </p>
            <h1 className="font-display text-4xl leading-[1.17] font-extrabold sm:text-5xl lg:text-[3.65rem] lg:leading-[1.16]">
              Vardagen ska kräva <span className="text-primary">mindre</span> av hjärnan
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
              MyFlove är ett mjukare sätt att planera vardagen. Fånga det som snurrar, forma dagen efter din energi och lägg fokus på det som faktiskt känns möjligt.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="min-h-12 rounded-full px-7 text-base shadow-lifted">
                <Link to="/sign-up">Prova MyFlove <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="min-h-12 rounded-full px-5 text-primary hover:text-primary">
                <a href="#funktioner">Så fungerar det <ArrowRight aria-hidden="true" /></a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Brain aria-hidden="true" className="h-4 w-4 text-primary" /> Mindre att hålla reda på</span>
              <span className="inline-flex items-center gap-2"><Heart aria-hidden="true" className="h-4 w-4 text-primary" /> Mer plats för livet</span>
            </div>
          </div>

          <div className="relative flex min-w-0 justify-center lg:justify-end" aria-label="Förhandsvisning av MyFloves dagsvy">
            <div className="absolute inset-x-4 top-8 bottom-8 rounded-[4rem] bg-secondary/80 sm:inset-x-12" aria-hidden="true" />
            <img
              src="/landing-day-preview.webp"
              alt="MyFloves riktiga dagsvy med dagens energi, mående och aktiviteter i en samlad vy"
              className="relative h-auto w-[min(72vw,310px)] rounded-[2.4rem] shadow-lifted sm:w-[350px] lg:w-[390px]"
              width={470}
              height={955}
            />
          </div>
        </div>
      </section>

      <section id="funktioner" aria-labelledby="features-heading" className="scroll-mt-8 bg-card py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-8 max-w-xl sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Det viktigaste först</p>
            <h2 id="features-heading" className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">En vardag i din takt</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="flex min-w-0 items-start gap-4 rounded-3xl border border-border bg-background p-5 shadow-soft sm:p-6">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${feature.accent}`}>
                  <feature.icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold sm:text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-9 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <Link to="/sign-up">Börja med MyFlove <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-5 py-8 text-center text-xs text-muted-foreground">
        <nav aria-label="Mer om MyFlove" className="flex flex-wrap justify-center gap-x-5 gap-y-3">
          <Link to="/guide/adhd-planner-for-adults" className="hover:text-primary">ADHD-planerare för vuxna</Link>
          <Link to="/integritet" className="hover:text-primary">Integritet</Link>
          <Link to="/villkor" className="hover:text-primary">Villkor</Link>
          <Link to="/cookies" className="hover:text-primary">Cookies</Link>
        </nav>
        <p className="mt-5">© {new Date().getFullYear()} MyFlove</p>
      </footer>
    </main>
  );
}