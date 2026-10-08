import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Leaf, ListChecks, Play, Sparkles, Zap, BatteryMedium } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { DayWindow } from "@/components/landing/day-window";
import { FeatureDemoDialog, type FeatureDemoId } from "@/components/landing/feature-demos";
import { MenuPreviewDialog } from "@/components/landing/menu-preview";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LandingTranslateProvider } from "@/components/auto-translate-provider";
import { BrandLogo } from "@/components/paceable/brand-logo";
import previewVideo from "@/assets/landing-intro-current.mp4.asset.json";
import previewWebm from "@/assets/landing-intro-current.webm.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paceable – Vardagen ska kräva mindre av hjärnan" },
      {
        name: "description",
        content: "Paceable hjälper dig fånga tankar, planera efter din energi och ta ett steg i taget. Ett mjukare sätt att få vardagen att gå ihop.",
      },
      { property: "og:title", content: "Paceable – Vardagen ska kräva mindre av hjärnan" },
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
    id: "quickflow",
    icon: Zap,
    title: "QuickFlow",
    text: "Få ner tankar, uppgifter och idéer innan de försvinner. Flow hjälper dig att sortera resten.",
    accent: "bg-lavender text-primary",
  },
  {
    id: "energi",
    icon: BatteryMedium,
    title: "Planering utifrån energi",
    text: "Planera smartare, inte hårdare. Anpassa dagen efter din energi och ditt mående.",
    accent: "bg-lavender text-primary",
  },
  {
    id: "steg",
    icon: Heart,
    title: "Ett steg i taget",
    text: "Stora mål blir enklare med små steg. Paceable hjälper dig att fira framsteg – varje dag.",
    accent: "bg-lavender text-primary",
  },
] as const;

function LandingPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"sv" | "en">(() => {
    if (typeof window === "undefined") return "sv";
    try { return window.localStorage.getItem("myflove-landing-language") === "en" ? "en" : "sv"; } catch { return "sv"; }
  });
  const chooseLang = (next: "sv" | "en") => {
    setLang(next);
    try { window.localStorage.setItem("myflove-landing-language", next); } catch { /* storage unavailable */ }
  };
  const [videoOpen, setVideoOpen] = useState(false);
  const [openDemo, setOpenDemo] = useState<FeatureDemoId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/idag" });
    });
  }, [navigate]);

  useEffect(() => {
    track("onboarding_started", { source: "intro" });
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-landing-background text-foreground">
      <header className="relative z-10 bg-landing-background">
        <div className="mx-auto grid min-h-18 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12">
          <Link to="/" aria-label="Paceable, startsida" className="flex shrink-0 items-center gap-2.5">
            <BrandLogo compact className="w-28 max-w-full sm:w-40 lg:hidden" />
            <BrandLogo className="hidden w-64 max-w-full lg:block" />
          </Link>
          <nav aria-label="Huvudmeny" className="hidden items-center gap-7 lg:flex">
            <Link to="/" className="text-sm font-semibold hover:text-primary">Hem</Link>
            <a href="#funktioner" className="text-sm font-medium text-muted-foreground hover:text-primary">Funktioner</a>
            <Link to="/om-oss" className="text-sm font-medium text-muted-foreground hover:text-primary">Om oss</Link>
          </nav>
          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label="Language / Språk" data-no-translate>
              <Button type="button" variant="ghost" size="sm" aria-label="Svenska" title="Svenska" aria-pressed={lang === "sv"} onClick={() => chooseLang("sv")} className={`h-9 px-2 text-xs ${lang === "sv" ? "font-bold text-primary underline underline-offset-4" : "text-muted-foreground"}`}>SV</Button>
              <Button type="button" variant="ghost" size="sm" aria-label="English" title="English" aria-pressed={lang === "en"} onClick={() => chooseLang("en")} className={`h-9 px-2 text-xs ${lang === "en" ? "font-bold text-primary underline underline-offset-4" : "text-muted-foreground"}`}>EN</Button>
            </div>
              <Button asChild variant="ghost" className="px-2 text-xs font-semibold text-foreground hover:text-primary sm:px-4 sm:text-sm"><Link to="/sign-in">Logga in</Link></Button>
            <Button asChild size="lg" className="min-h-10 rounded-full px-3 shadow-soft sm:px-7"><Link to="/sign-up">Kom igång</Link></Button>
          </div>
        </div>
        <nav aria-label="Mobil meny" className="flex justify-center gap-6 border-t border-border/50 px-4 py-2 text-xs font-medium text-muted-foreground lg:hidden">
          <Link to="/" className="text-foreground">Hem</Link>
          <a href="#funktioner">Funktioner</a>
          <Link to="/om-oss">Om oss</Link>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-landing-background">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pt-10 pb-10 sm:px-8 lg:min-h-[525px] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-7 lg:px-12 lg:pt-8 lg:pb-5">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-7 text-[11px] font-bold text-primary" data-no-translate>Ditt liv, i din takt.</p>
            <h1 className="font-display text-[2.4rem] leading-[1.15] font-extrabold sm:text-5xl lg:text-[3.2rem] xl:text-[3.65rem]">
              Vardagen ska kräva <span className="text-primary">mindre</span> av hjärnan
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Paceable är en vardagsplanerare för dig med en full hjärna. Vi hjälper dig att planera med omtanke, få struktur utan stress och fokusera på det som faktiskt känns bra.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="min-h-12 rounded-full px-7 text-base shadow-soft">
                <Link to="/sign-up">Prova Paceable <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button variant="ghost" size="lg" className="min-h-12 rounded-full px-2 text-foreground hover:text-primary" onClick={() => setVideoOpen(true)}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary text-primary"><Play className="size-4 fill-current" aria-hidden="true" /></span>
                 <span className="text-left leading-tight">Se hur det fungerar <span className="block text-xs font-normal text-muted-foreground">ca 24 sek</span></span>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Leaf aria-hidden="true" className="h-4 w-4 text-primary" /> Mindre stress</span>
              <span className="inline-flex items-center gap-2"><Heart aria-hidden="true" className="h-4 w-4 text-primary" /> Mer balans</span>
              <span className="inline-flex items-center gap-2"><Sparkles aria-hidden="true" className="h-4 w-4 text-primary" /> En snällare vardag</span>
            </div>
          </div>

          <div className="relative min-w-0 lg:pl-3">
            <div className="relative lg:ml-6"><DayWindow /></div>
            <div className="hidden lg:absolute lg:-bottom-4 lg:-left-16 lg:block lg:rotate-[-7deg] lg:text-center lg:font-handwritten lg:text-2xl lg:leading-none lg:text-primary">
              <span aria-hidden="true" className="block rotate-[-16deg] text-5xl">↗</span>
              Små steg.<br />Stora förändringar. <span aria-hidden="true">♥</span>
            </div>
          </div>
        </div>
      </section>

      <section id="funktioner" aria-label="Paceables funktioner" className="scroll-mt-8 bg-landing-background pb-16 pt-4 sm:pt-8">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 rounded-3xl border border-border/60 bg-landing-surface p-5 shadow-soft sm:p-6">
                <span className={`col-span-2 grid h-13 w-13 place-items-center rounded-full ${feature.accent}`}>
                  <feature.icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold sm:text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title={`Prova ${feature.title}`}
                  aria-label={`Prova ${feature.title} direkt på sidan`}
                  onClick={() => {
                    track("landing_demo_opened", { source: feature.id });
                    setOpenDemo(feature.id);
                  }}
                  className="self-end rounded-full bg-landing-sand text-primary"
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                track("landing_demo_opened", { source: "meny" });
                setMenuOpen(true);
              }}
              className="inline-flex min-h-12 items-center gap-3 rounded-full border border-border/60 bg-landing-surface px-6 text-sm font-semibold shadow-soft transition-colors hover:text-primary"
            >
              <ListChecks aria-hidden="true" className="h-5 w-5 text-primary" strokeWidth={1.8} />
              Se allt som finns i appen
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-landing-sand px-5 py-8 text-center text-xs text-muted-foreground">
        <nav aria-label="Mer om Paceable" className="flex flex-wrap justify-center gap-x-5 gap-y-3">
          <Link to="/guide/adhd-planner-for-adults" className="hover:text-primary">ADHD-planerare för vuxna</Link>
          <Link to="/integritet" className="hover:text-primary">Integritet</Link>
          <Link to="/villkor" className="hover:text-primary">Villkor</Link>
          <Link to="/cookies" className="hover:text-primary">Cookies</Link>
        </nav>
        <p className="mt-5">© {new Date().getFullYear()} Paceable</p>
      </footer>
      <FeatureDemoDialog demo={openDemo} onClose={() => setOpenDemo(null)} />
      <MenuPreviewDialog open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl bg-landing-background p-4 sm:max-w-4xl sm:p-6">
          <DialogTitle>Se hur Paceable fungerar</DialogTitle>
          <DialogDescription>En kort introduktion till dagens Paceable.</DialogDescription>
          {videoOpen && <video controls autoPlay playsInline className="aspect-video w-full rounded-xl bg-foreground" aria-label="Paceable introduktionsfilm"><source src={previewWebm.url} type="video/webm" /><source src={previewVideo.url} type="video/mp4" /></video>}
        </DialogContent>
      </Dialog>
      <LandingTranslateProvider lang={lang} />
    </main>
  );
}