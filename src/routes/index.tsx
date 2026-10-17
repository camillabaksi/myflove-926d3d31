import { PUBLIC_BASE_URL } from "@/lib/public-url";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, Play, NotebookPen, Footprints, BatteryMedium } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { DayWindow } from "@/components/landing/day-window";
import { FeatureDemoDialog, type FeatureDemoId } from "@/components/landing/feature-demos";
import { MenuPreviewDialog } from "@/components/landing/menu-preview";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PublicPage } from "@/components/landing/public-page";
import { PlatformChoices } from "@/components/landing/platform-choices";
import "@/components/landing/welcome.css";
import previewVideo from "@/assets/paceable-intro-sv-2026-10-13.mp4.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paceable – Ditt liv, i din takt" },
      {
        name: "description",
        content:
          "Samla tankarna, få överblick över dagen och planera efter din ork. Paceable hjälper dig att hitta ditt nästa lilla steg.",
      },
      { property: "og:title", content: "Paceable – Ditt liv, i din takt" },
      {
        property: "og:description",
        content: "Fånga tankar, planera efter din dagsform och fokusera på nästa rimliga steg.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${PUBLIC_BASE_URL}/` }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const openerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = () => openerRef.current?.focus();
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
    <PublicPage quiet>
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-wrap welcome-hero-grid">
          <div className="welcome-intro">
            <p className="welcome-eyebrow" data-no-translate>
              Ditt liv, i din takt.
            </p>
            <h1 id="welcome-title">
              Du behöver inte hålla <em>allt</em> i huvudet.
            </h1>
            <p className="welcome-lead">
              Samla tankarna, få överblick över dagen och planera efter din ork. Paceable hjälper
              dig att hitta ditt nästa lilla steg.
            </p>
            <div className="welcome-actions">
              <Button asChild size="lg" className="welcome-primary">
                <a href="#prova">
                  Prova Paceable <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <button
                type="button"
                className="welcome-film"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setVideoOpen(true);
                }}
              >
                <span className="welcome-play">
                  <Play aria-hidden="true" />
                </span>
                <span>
                  Ta en liten titt<span className="welcome-film-length">Se filmen · ca 54 sek</span>
                </span>
              </button>
            </div>
            <p className="welcome-permission">Du kan börja med en enda sak.</p>
          </div>
          <div className="welcome-glimpse">
            <DayWindow />
            <p className="welcome-handnote">Lite mer utrymme. Lite mindre brus.</p>
          </div>
        </div>
      </section>

      <section id="funktioner" className="welcome-support" aria-labelledby="support-title">
        <div className="welcome-wrap">
          <div className="welcome-section-heading">
            <p className="welcome-eyebrow">En mjukare start</p>
            <h2 id="support-title">Vad behöver du just nu?</h2>
            <p>Du väljer var du vill börja. Resten får vänta.</p>
          </div>
          <div className="welcome-support-grid">
            {[
              {
                id: "quickflow",
                icon: NotebookPen,
                title: "Få ner det som snurrar",
                text: "En tanke, en idé eller något du behöver komma ihåg. Ge det en plats utanför huvudet.",
                action: "Prova Fånga",
                tone: "lavender",
              },
              {
                id: "energi",
                icon: BatteryMedium,
                title: "Utgå från din ork",
                text: "Checka in med dig själv och planera med utrymme för både det som behövs och återhämtning.",
                action: "Utforska energiplanering",
                tone: "sage",
              },
              {
                id: "steg",
                icon: Footprints,
                title: "Ta ett litet steg",
                text: "När något känns stort kan ett mindre steg vara en början. Du behöver inte göra allt på en gång.",
                action: "Prova små steg",
                tone: "apricot",
              },
            ].map((feature) => (
              <article key={feature.id} className="welcome-support-item" data-tone={feature.tone}>
                <span className="welcome-feature-icon">
                  <feature.icon aria-hidden="true" strokeWidth={1.5} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <button
                  type="button"
                  className="welcome-text-link"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget;
                    track("landing_demo_opened", { source: feature.id });
                    setOpenDemo(feature.id as FeatureDemoId);
                  }}
                >
                  {feature.action}
                  <ArrowRight aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="welcome-explore"
            onClick={(event) => {
              openerRef.current = event.currentTarget;
              track("landing_demo_opened", { source: "meny" });
              setMenuOpen(true);
            }}
          >
            Se mer av Paceable
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <PlatformChoices />

      <section className="welcome-invitation" aria-labelledby="invitation-title">
        <div className="welcome-wrap">
          <Heart aria-hidden="true" strokeWidth={1.3} />
          <h2 id="invitation-title">Här får du börja där du är.</h2>
          <p>För dagar med mycket energi. Och för dagar när en sak är lagom.</p>
          <Button asChild size="lg" className="welcome-primary">
            <a href="#prova">
              Hitta din takt med Paceable
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </section>

      <FeatureDemoDialog
        returnFocus={returnFocus}
        demo={openDemo}
        onClose={() => setOpenDemo(null)}
      />
      <MenuPreviewDialog
        returnFocus={returnFocus}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus();
          }}
          className="max-w-4xl bg-landing-background p-4 sm:max-w-4xl sm:p-6"
        >
          <DialogTitle>Se hur Paceable fungerar</DialogTitle>
          <DialogDescription>En kort introduktion till dagens Paceable.</DialogDescription>
          {videoOpen && (
            <video
              controls
              playsInline
              className="aspect-video w-full rounded-xl bg-foreground"
              aria-label="Paceable introduktionsfilm"
            >
              <source src={previewVideo.url} type="video/mp4" />
            </video>
          )}
        </DialogContent>
      </Dialog>
    </PublicPage>
  );
}
