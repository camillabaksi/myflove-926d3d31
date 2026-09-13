import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FlowMascot, FlowSays } from "@/components/flow-mascot";
import PwaInstallButton from "@/components/pwa-install-button";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyFlove – Bär mindre. Gör inte mer." },
      {
        name: "description",
        content:
          "Möt Flow – en lugn, intelligent följeslagare som håller ihop kalender, ekonomi, hälsa, familj, inköp och ärenden så att du kan bära mindre.",
      },
      { property: "og:title", content: "MyFlove – Bär mindre. Gör inte mer." },
      {
        property: "og:description",
        content:
          "Flow håller ihop kalender, ekonomi, hälsa, familj och ärenden – så att du kan bära mindre i huvudet.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "MyFlove – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MyFlove – Bär mindre. Gör inte mer." },
      {
        name: "twitter:description",
        content:
          "Flow håller ihop kalender, ekonomi, hälsa, familj och ärenden – så att du kan bära mindre i huvudet.",
      },
      { property: "og:url", content: "https://myflove.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/" }],
  }),
  component: LandingPage,
});

const HELP_POINTS = [
  {
    icon: "🧠",
    title: "Säg vad som snurrar",
    text: "Skriv eller säg allt du bär på. Flow sorterar det åt dig – du behöver inte organisera något själv.",
  },
  {
    icon: "🔋",
    title: "Få en plan efter din energi",
    text: "FlowPlan lägger dagen i en ordning som matchar din kapacitet. Lågt batteri? Då blir planen lättare.",
  },
  {
    icon: "💜",
    title: "Bär mindre, utan skuld",
    text: "Det som inte måste göras flyttas framåt. Kvar blir det som faktiskt räknas idag.",
  },
] as const;

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/hem" });
      }
    });
  }, [navigate]);

  useEffect(() => {
    track("onboarding_started", { source: "intro" });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#F8F5FE] text-[#2A2140]">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-16 pb-14 sm:px-6 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[280px] w-[280px] rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CE0] opacity-25 blur-3xl sm:h-[420px] sm:w-[420px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 h-[240px] w-[240px] rounded-full bg-[#F5B8D0] opacity-25 blur-3xl sm:h-[360px] sm:w-[360px]"
        />

        <div className="relative mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase sm:text-xs">
            MyFlove
          </p>
          <div className="mt-6 flex justify-center">
            <FlowMascot size="xl" glow />
          </div>
          <h1 className="font-display mt-6 text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
            Bär mindre.
            <br />
            Gör inte mer.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#6B647F] sm:text-lg">
            Flow håller ihop kalender, hem, hälsa och ärenden – så att du kan
            släppa det du bär i huvudet.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 w-full max-w-xs rounded-full bg-[#7C5CE0] px-8 text-base font-semibold text-white shadow-lg hover:bg-[#6A4BCF]"
            >
              <Link to="/sign-up">Kom igång</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 rounded-full px-6 text-sm font-semibold text-[#7C5CE0] hover:bg-[#7C5CE0]/10"
            >
              <Link to="/sign-in">Jag har redan ett konto</Link>
            </Button>
            <PwaInstallButton />
          </div>
        </div>
      </section>

      {/* Så hjälper Flow */}
      <section className="px-5 pb-16 sm:px-6">
        <div className="mx-auto max-w-xl space-y-4">
          <FlowSays mood="wave">
            Du behöver inte göra allt. Vi börjar med det som spelar roll just nu.
          </FlowSays>
          {HELP_POINTS.map((point) => (
            <article
              key={point.title}
              className="flex items-start gap-4 rounded-3xl border border-[#2A2140]/5 bg-white p-5 shadow-sm"
            >
              <span aria-hidden className="mt-0.5 text-2xl">
                {point.icon}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold">{point.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6B647F]">
                  {point.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2140]/5 px-5 pt-8 pb-10 text-center">
        <nav
          aria-label="Om MyFlove"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#6B647F]"
        >
          <Link to="/guide/adhd-planner-for-adults" className="hover:text-[#7C5CE0]">
            ADHD-planerare för vuxna
          </Link>
          <Link to="/integritet" className="hover:text-[#7C5CE0]">
            Integritet
          </Link>
          <Link to="/villkor" className="hover:text-[#7C5CE0]">
            Villkor
          </Link>
          <Link to="/cookies" className="hover:text-[#7C5CE0]">
            Cookies
          </Link>
        </nav>
        <p className="mt-4 text-[11px] text-[#6B647F]/70">
          © {new Date().getFullYear()} MyFlove · Byggd för huvuden som bär mycket
        </p>
      </footer>
    </main>
  );
}
