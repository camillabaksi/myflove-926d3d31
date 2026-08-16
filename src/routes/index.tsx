import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/hem" });
      }
    });
  }, [navigate]);



  return (
    <main className="min-h-screen bg-[#F8F5FE] text-[#2A2140]">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="pointer-events-none absolute -top-40 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CE0] opacity-80 blur-sm" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-[320px] w-[320px] rounded-full bg-[#C4B5FD] opacity-50" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#7C5CE0] font-semibold">MyFlove</p>
          <h1 className="mt-4 font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight">
            MyFlove – lugn planering för ADHD, autism och ett fullt huvud
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[#6B647F] max-w-xl mx-auto leading-relaxed">
            Ett lugnare hem för hjärnan – för dig som lever med ADHD, autism eller
            bara mycket i huvudet. 💙
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#7C5CE0] hover:bg-[#6A48CE] text-white shadow-lg shadow-[#7C5CE0]/25"
            >
              <Link to="/sign-up">Kom igång – gratis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[#2A2140]/20 bg-white/60 backdrop-blur hover:bg-white"
            >
              <Link to="/sign-in">Jag har redan konto</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Flow talar ────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
            Flow talar
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">
            Som en vän i fickan.
          </h2>
          <p className="mt-4 text-[#6B647F] max-w-xl">
            Flow är lugn, empatisk och mänsklig. Aldrig tjatig, aldrig
            skuldbeläggande.
          </p>

          <div className="mt-10 space-y-5 max-w-2xl">
            <FlowBubble>
              <p>God morgon Camilla 💙</p>
              <p>Det ser ut att bli regn idag. Ta gärna med ett paraply.</p>
              <p>Glöm inte din medicin innan du går hemifrån.</p>
            </FlowBubble>
            <FlowBubble>
              <p>Jag ser att du har mycket idag.</p>
              <p>Ska vi börja med de tre viktigaste sakerna?</p>
            </FlowBubble>
            <FlowBubble>
              <p>Det blev mycket idag.</p>
              <p>Vi tar en sak i taget – börja med den enklaste.</p>
            </FlowBubble>
          </div>
        </div>
      </section>

      {/* ── Alla moduler hänger ihop ─────────────────────── */}
      <section className="px-6 py-20 md:py-28 bg-[#F1ECFC]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
            Allt hänger ihop
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">
            En hjärna. Inte sju appar.
          </h2>
          <p className="mt-4 text-[#6B647F] max-w-2xl">
            Kalender, ekonomi, hälsa, familj, inköp, ärenden och FlowPlan™ är
            inte separata funktioner. Flow läser av allt – och hjälper dig med
            helheten.
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { i: "▤", l: "Kalender" },
              { i: "💳", l: "Ekonomi" },
              { i: "♥", l: "Hälsa" },
              { i: "👪", l: "Familj" },
              { i: "🛒", l: "Inköp" },
              { i: "✓", l: "Ärenden" },
              { i: "≡", l: "FlowPlan™" },
              { i: "✦", l: "Flow AI" },
            ].map((m) => (
              <div
                key={m.l}
                className="bg-white rounded-2xl p-4 text-center shadow-sm border border-[#2A2140]/5"
              >
                <div className="text-2xl">{m.i}</div>
                <div className="mt-1 text-sm font-semibold text-[#2A2140]">
                  {m.l}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-white/70 border border-[#7C5CE0]/20 p-5 max-w-2xl">
            <p className="text-sm italic text-[#2A2140] leading-relaxed">
              "Jag såg att du har läkarbesök 14:00, saknar mjölk hemma, och att
              banken drar hyran imorgon. Ska jag flytta träningen?"
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-[#7C5CE0] font-semibold">
              — Flow
            </p>
          </div>
        </div>
      </section>

      {/* ── Scenarier ───────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
            I vardagen
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">
            När livet skaver – finns Flow där.
          </h2>

          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {[
              {
                s: "Morgonstress",
                r: "Vi tar en sak i taget. Börja med kaffet – resten väntar.",
              },
              {
                s: "Glömde paraplyet",
                r: "Regn om 20 min. Paraplyet står vid dörren.",
              },
              {
                s: "Vet inte var jag ska börja",
                r: "Här är de tre viktigaste idag. Välj en – jag håller resten.",
              },
              {
                s: "Dålig energidag",
                r: "Idag räcker det. Vi flyttar det som inte måste göras.",
              },
            ].map((sc) => (
              <div
                key={sc.s}
                className="rounded-3xl bg-white p-6 shadow-sm border border-[#2A2140]/5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-[#7C5CE0] font-semibold">
                  {sc.s}
                </p>
                <p className="mt-3 font-display text-xl leading-snug text-[#2A2140]">
                  {sc.r}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FlowPlan ────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 bg-[#2A2140] text-[#FBF9FF] relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-20 h-[300px] w-[300px] rounded-full bg-[#F5B8D0] opacity-20" />
        <div className="mx-auto max-w-5xl relative">
          <p className="text-xs uppercase tracking-[0.3em] text-[#F5B8D0] font-semibold">
            FlowPlan™
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">
            Rätt sak, i rätt ordning.
          </h2>
          <p className="mt-4 text-white/70 max-w-xl">
            Du säger vad som ska göras. Flow räknar ut den mest effektiva
            ordningen – och förklarar varför.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">
                Du behöver
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Duscha", "Starta tvättmaskinen", "Laga middag", "Starta robotdammsugaren"].map(
                  (t) => (
                    <span
                      key={t}
                      className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm"
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-[#F5B8D0] font-semibold">
                Flow föreslår
              </p>
              <div className="mt-3 space-y-2">
                {[
                  { n: 1, s: "Starta tvättmaskinen", w: "Går själv medan du gör annat.", t: "0 min" },
                  { n: 2, s: "Starta robotdammsugaren", w: "Städar medan du duschar.", t: "1 min" },
                  { n: 3, s: "Duscha", w: "Lugn stund. Ingen väntar på dig.", t: "5 min" },
                  { n: 4, s: "Laga middag", w: "Tvätten färdig snart – hänger efter maten.", t: "25 min" },
                ].map((st) => (
                  <div
                    key={st.n}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 p-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#7C5CE0] text-white flex items-center justify-center font-display font-bold flex-shrink-0">
                      {st.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{st.s}</div>
                      <div className="text-xs text-white/60">{st.w}</div>
                    </div>
                    <div className="text-[11px] font-semibold text-[#F5B8D0] bg-[#F5B8D0]/10 rounded-md px-2 py-1 flex-shrink-0">
                      {st.t}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Känslan ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-1">
              {["lugn.", "trygghet.", "värme.", "enkelhet.", "mindre att bära."].map((w) => (
                <div
                  key={w}
                  className="font-display text-4xl md:text-5xl font-bold leading-tight text-[#2A2140]"
                >
                  {w}
                </div>
              ))}
            </div>
            <p className="text-[#6B647F] text-lg leading-relaxed">
              MyFlove handlar inte om produktivitet. Inte om prestation.
              <br />
              Bara om mindre mental belastning – varje dag.
            </p>
          </div>
        </div>
      </section>

      {/* ── Vision / avslut ─────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 bg-[#2A2140] text-[#FBF9FF] relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-[#7C5CE0] opacity-30 blur-md" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-[#C4B5FD] opacity-25" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#F5B8D0] font-semibold">
            Vår vision
          </p>
          <h2 className="mt-6 font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Vi bygger inte funktioner.<br />
            Vi löser vardagsfriktion.
          </h2>
          <p className="mt-6 font-display text-2xl md:text-3xl italic text-[#A78BFA]">
            Bär mindre. Gör inte mer.
          </p>
          <p className="mt-10 text-white/70 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Du öppnar inte en app. Du möter Flow – en lugn, intelligent
            följeslagare som hjälper dig genom vardagen. 💙
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#7C5CE0] hover:bg-[#6A48CE] text-white shadow-lg shadow-[#7C5CE0]/30"
            >
              <Link to="/sign-up">Möt Flow</Link>
            </Button>
          </div>
          <p className="mt-8 text-xs text-white/40 tracking-widest">
            mitt-flow.lovable.app
          </p>
        </div>
      </section>

      <footer className="bg-[#2A2140] text-white/60 border-t border-white/10 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} MyFlove</p>
          <nav className="flex gap-5">
            <Link to="/integritet" className="hover:text-white">Integritet</Link>
            <Link to="/villkor" className="hover:text-white">Villkor</Link>
            <Link to="/cookies" className="hover:text-white">Cookies</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function FlowBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CE0] text-white flex items-center justify-center font-display font-bold flex-shrink-0 shadow-md">
        F
      </div>
      <div className="bg-white rounded-3xl rounded-tl-md px-5 py-4 shadow-sm border border-[#2A2140]/5 space-y-2 text-[#2A2140] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
