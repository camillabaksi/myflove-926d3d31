import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FlowMascot, FlowSays } from "@/components/flow-mascot";
import PwaInstallButton from "@/components/pwa-install-button";

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

/* ── Data för demon ───────────────────────────────────────── */

const NEEDS = [
  {
    id: "overwhelmed",
    icon: "🧠",
    label: "Jag är överväldigad",
    reply: "Okej. Då börjar vi inte med allt. 💜 Vad är viktigast just nu?",
    steps: [
      "Flow plockar fram tre saker – resten göms undan.",
      "Allt som kan vänta flyttas till imorgon, utan skuld.",
      "Du får en enda knapp: börja här.",
    ],
  },
  {
    id: "start",
    icon: "🚀",
    label: "Jag behöver komma igång",
    reply: "Vi tar det minsta steget först. Det räcker att börja.",
    steps: [
      "Flow föreslår en uppgift på 5 minuter.",
      "En timer startar – ingen planering krävs.",
      "När du är klar bockas den av automatiskt.",
    ],
  },
  {
    id: "plan",
    icon: "📅",
    label: "Jag behöver planera",
    reply: "Säg vad som ska göras – jag lägger dem i en ordning som funkar.",
    steps: [
      "FlowPlan™ sorterar uppgifterna efter energi och tid.",
      "Du ser varför ordningen ser ut som den gör.",
      "Du kan flytta om allt själv – förslaget är bara ett förslag.",
    ],
  },
  {
    id: "empty",
    icon: "🔋",
    label: "Jag har noll energi",
    reply: "Då gör vi mindre idag. Det är också ett bra beslut.",
    steps: [
      "Kraven sänks automatiskt när batteriet är lågt.",
      "Flow flyttar det som inte måste göras.",
      "Kvar blir en sak – ofta bara att vila.",
    ],
  },
  {
    id: "all",
    icon: "✨",
    label: "Visa mig allt",
    reply: "Här är helheten – kalender, hem, hälsa, ekonomi och studier på ett ställe.",
    steps: [
      "Allt i dagen: planerat och genomfört i samma vy.",
      "Mitt batteri visar din kapacitet – inte din prestation.",
      "QuickFlow fångar allt du tänker på, sorteras sen.",
    ],
  },
] as const;

const DAILY_FLOWS = [
  "Du behöver inte göra allt bara för att du kan göra allt.",
  "Det blev mycket idag. Det säger inget om dig.",
  "En sak i taget är fortfarande framåt.",
  "Vila är också något du gör.",
  "Det räknas, hur litet det än känns.",
];

const TIMELINE = [
  { t: "08:00", l: "God morgon ☀️", c: "Regn ikväll – ta med paraply.", m: "Jag har koll. 💜" },
  { t: "08:30", l: "Lämna barnen", c: "Väskan står redan vid dörren.", m: "En sak mindre." },
  { t: "09:00", l: "Plugg 📚", c: "42 minuter fokus. Sen paus.", m: "Jag håller tiden." },
  { t: "10:30", l: "Paus ☕", c: "Du hann mer än du tror.", m: "Pausen räknas också." },
  { t: "12:00", l: "Lunch 🌿", c: "Ät något – batteriet tackar dig.", m: "+ lite energi." },
  {
    t: "17:30",
    l: "Handla 🛒",
    c: "Mjölk saknas hemma. Butiken ligger på vägen.",
    m: "Listan är redan skriven.",
  },
  { t: "21:00", l: "Varva ner 🌙", c: "Imorgon är lugnare. Jag har koll.", m: "Dagen är klar nu." },
];

const PHONE_ITEMS = [
  { t: "09:00", l: "Fokustid", e: "🎯", done: false, r: "42 minuter fokus. Jag säger till när det är paus." },
  { t: "10:30", l: "Medicin", e: "💊", done: true, r: "Redan taget idag. Bra jobbat 💜" },
  { t: "12:00", l: "Lunch", e: "🌿", done: false, r: "Lunch laddar batteriet mer än du tror." },
  { t: "17:30", l: "Handla", e: "🛒", done: false, r: "Mjölk står på listan. Butiken ligger på vägen." },
];

const PHONE_DONE_REACTIONS = [
  "Avbockat. Det räknas. 💜",
  "Fint – en sak mindre att bära.",
  "Klart. Jag flyttar resten framåt.",
];

const PHONE_UNDONE_REACTIONS = [
  "Inga problem, jag lägger tillbaka den.",
  "Den får vänta. Helt okej.",
];

const PHONE_IDLE = "Du har 25 minuter kvar. Vill du hinna duscha eller ta det lugnt?";

/* ── Sidan ────────────────────────────────────────────────── */

const SLIDES: { id: string; label: string; render: () => React.ReactNode }[] = [
  { id: "hero", label: "Möt Flow", render: () => <Hero /> },
  { id: "need", label: "Vad behöver du?", render: () => <NeedSection /> },
  { id: "daily", label: "Dagens Flow", render: () => <DailyFlow /> },
  { id: "flowscore", label: "FlowScore", render: () => <FlowScoreSection /> },
  { id: "day", label: "En dag", render: () => <DaySection /> },
  { id: "voice", label: "Flow talar", render: () => <FlowVoice /> },
  { id: "modules", label: "Allt hänger ihop", render: () => <Modules /> },
  { id: "flowplan", label: "FlowPlan", render: () => <FlowPlanSection /> },
  { id: "building", label: "Byggs just nu", render: () => <BuildingSection /> },
  {
    id: "vision",
    label: "Vår vision",
    render: () => (
      <>
        <Vision />
        <Footer />
      </>
    ),
  },
];

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/hem" });
      }
    });
  }, [navigate]);

  return <LandingDeck />;
}

/* ── Slide-deck: horisontellt spår, svep + tangentbord ────── */

function slideIndexFromHash(hash: string) {
  const id = hash.replace(/^#/, "");
  const i = SLIDES.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}

function LandingDeck() {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    axis: "none" | "x" | "y";
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const shouldFocus = useRef(false);

  const total = SLIDES.length;
  const goTo = (next: number, focus = true) => {
    shouldFocus.current = focus;
    setIndex(Math.max(0, Math.min(total - 1, next)));
  };

  // URL-synk: läs vid start och lyssna på bakåt/framåt
  useEffect(() => {
    setIndex(slideIndexFromHash(window.location.hash));
    const onHash = () => setIndex(slideIndexFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // URL-synk: skriv tillbaka aktuell vy
  useEffect(() => {
    const target = `#${SLIDES[index].id}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${target}`);
    }
  }, [index]);

  // Flytta fokus till aktiv vy vid navigering (inte vid första renderingen)
  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    slideRefs.current[index]?.focus({ preventScroll: true });
  }, [index]);

  // Interna länkar (t.ex. "Se hur det fungerar") kan hoppa till en vy
  useEffect(() => {
    const jump = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") goTo(detail);
    };
    window.addEventListener("myflove:landing-slide", jump);
    return () => window.removeEventListener("myflove:landing-slide", jump);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, [role='slider'], [contenteditable]"));

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isInteractive(event.target)) return;
    const now = Date.now();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      time: now,
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
      axis: "none",
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (state.axis === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      state.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (state.axis === "y") {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        drag.current = null;
        return;
      }
      setDragging(true);
    }

    if (event.cancelable) event.preventDefault();

    // Momentum: rullande hastighet i px/ms
    const now = Date.now();
    const dt = Math.max(1, now - state.lastTime);
    const instant = (event.clientX - state.lastX) / dt;
    state.velocity = state.velocity * 0.7 + instant * 0.3;
    state.lastX = event.clientX;
    state.lastTime = now;

    const atStart = index === 0 && dx > 0;
    const atEnd = index === total - 1 && dx < 0;
    // Mjukt kantmotstånd som avtar med avståndet
    setDragOffset(atStart || atEnd ? Math.sign(dx) * Math.sqrt(Math.abs(dx)) * 6 : dx);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    setDragging(false);
    setDragOffset(0);
    if (!state || state.axis !== "x") return;

    // iOS kan skicka pointercancel med clientX=0 när gesten börjar nära
    // skärmkanten. Använd därför den senast säkra positionen från move.
    const dx = state.lastX - state.x;
    const width = viewportRef.current?.clientWidth ?? 1;
    const velocity = state.velocity; // px/ms, positiv = åt höger
    // Projicerad slutposition med momentum (~200 ms utrullning)
    const projected = dx + velocity * 200;
    const threshold = Math.min(72, Math.max(28, width * 0.1));

    // Faktisk dragsträcka får alltid företräde framför ett brusigt sista
    // hastighetsvärde. Det gör framför allt högersvep stabilt på mobil.
    if (dx <= -threshold || (dx < 0 && projected <= -threshold)) goTo(index + 1);
    else if (dx >= threshold || (dx > 0 && projected >= threshold)) goTo(index - 1);
  };

  // Piltangenter fungerar även när fokus ligger på sidan i stort
  useEffect(() => {
    const onWindowKey = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], [role='slider']")) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "Home") goTo(0);
      else if (event.key === "End") goTo(total - 1);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);



  return (
    <main className="relative h-[100dvh] overflow-hidden overscroll-none bg-[#F8F5FE] text-[#2A2140] [overscroll-behavior-x:none]">
      <div
        ref={viewportRef}
        data-landing-viewport
        role="group"
        aria-roledescription="karusell"
        aria-label="MyFlove-presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-full w-full touch-pan-y overflow-hidden overscroll-x-none [overscroll-behavior-x:none]"
      >
        <div
          data-landing-track
          className={`flex h-full w-full flex-row ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))` }}
        >
          {SLIDES.map((slide, i) => {
            const active = i === index;
            return (
              <section
                key={slide.id}
                id={`slide-${slide.id}`}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                data-landing-slide={slide.id}
                aria-hidden={!active}
                inert={!active}
                tabIndex={active ? 0 : -1}
                aria-roledescription="vy"
                aria-label={`${slide.label} – vy ${i + 1} av ${total}`}
                className={`h-full w-full min-w-full shrink-0 overflow-y-auto overscroll-contain pb-28 transition-opacity duration-500 outline-none focus-visible:ring-4 focus-visible:ring-[#7C5CE0]/40 focus-visible:ring-inset ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex min-h-full flex-col justify-center">{slide.render()}</div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Navigering */}
      <button
        type="button"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Föregående vy"
        aria-controls={`slide-${SLIDES[index].id}`}
        className="press absolute top-1/2 left-2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#2A2140]/10 bg-white/85 text-lg shadow-lg backdrop-blur focus-visible:ring-2 focus-visible:ring-[#7C5CE0] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        disabled={index === total - 1}
        aria-label="Nästa vy"
        aria-controls={`slide-${SLIDES[index].id}`}
        className="press absolute top-1/2 right-2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#2A2140]/10 bg-white/85 text-lg shadow-lg backdrop-blur focus-visible:ring-2 focus-visible:ring-[#7C5CE0] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0"
      >
        ›
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-gradient-to-t from-[#F8F5FE] via-[#F8F5FE]/80 to-transparent pt-8 pb-4">
        <div
          role="tablist"
          aria-label="Välj vy"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 px-4"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              id={`tab-${slide.id}`}
              aria-controls={`slide-${slide.id}`}
              aria-selected={i === index}
              tabIndex={i === index ? 0 : -1}
              onClick={() => goTo(i)}
              aria-label={`${slide.label} – vy ${i + 1} av ${total}`}
              className={`h-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-[#7C5CE0] focus-visible:ring-offset-2 focus-visible:outline-none ${
                i === index ? "w-7 bg-[#7C5CE0]" : "w-2.5 bg-[#2A2140]/20 hover:bg-[#7C5CE0]/50"
              }`}
            />
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-2 px-4 sm:hidden">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Tillbaka till föregående vy"
            className="press flex items-center gap-1.5 rounded-full border border-[#2A2140]/10 bg-white px-4 py-2 text-sm font-semibold text-[#2A2140] shadow-md focus-visible:ring-2 focus-visible:ring-[#7C5CE0] focus-visible:outline-none disabled:opacity-40"
          >
            ‹ Tillbaka
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            aria-label="Nästa vy"
            className="press flex items-center gap-1.5 rounded-full bg-[#7C5CE0] px-4 py-2 text-sm font-semibold text-white shadow-md focus-visible:ring-2 focus-visible:ring-[#7C5CE0] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-40"
          >
            Nästa ›
          </button>
        </div>
        <p className="text-[11px] font-semibold text-[#6B647F]">
          Svep i sidled · {index + 1} / {total}
        </p>

      </div>

      <p aria-live="polite" className="sr-only">
        {SLIDES[index].label}, vy {index + 1} av {total}
      </p>
    </main>
  );
}



/* ── Hero ─────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-12 pb-16 sm:px-6 md:pt-20 md:pb-24">
      <div className="pointer-events-none absolute -top-44 -right-40 h-[280px] w-[280px] rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C5CE0] opacity-25 blur-3xl sm:h-[460px] sm:w-[460px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[240px] w-[240px] rounded-full bg-[#F5B8D0] opacity-25 blur-3xl sm:h-[360px] sm:w-[360px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="pop-in text-center lg:text-left">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase sm:text-xs">
            MyFlove
          </p>
          <h1 className="font-display mt-4 text-[2.4rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl md:text-7xl">
            Bär mindre.
            <br />
            Gör inte mer.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#6B647F] sm:text-lg lg:mx-0">
            MyFlove är ett lugnare hem för hjärnan – för dig med ADHD, autism eller bara mycket i
            huvudet. Flow håller ihop dagen så att du slipper göra det i huvudet.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button
              asChild
              size="lg"
              className="press rounded-full bg-[#7C5CE0] text-white shadow-lg shadow-[#7C5CE0]/25 hover:bg-[#6A48CE]"
            >
              <Link to="/sign-up">Testa MyFlove gratis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="press rounded-full border-[#2A2140]/15 bg-white/70 backdrop-blur hover:bg-white"
            >
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("myflove:landing-slide", { detail: 1 }))
                }
              >
                Se hur det fungerar
              </button>
            </Button>
          </div>

          <div className="mx-auto mt-4 w-full max-w-xs lg:mx-0">
            <PwaInstallButton
              variant="outline"
              className="border-[#2A2140]/15 bg-white/70 backdrop-blur hover:bg-white"
            />
          </div>



          <div className="mx-auto mt-8 w-full max-w-xl lg:mx-0">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-left sm:gap-5">
              <FlowMascot
                size="2xl"
                wave
                glow
                className="shrink-0"
                imgClassName="h-44 w-44 sm:h-64 sm:w-64 lg:h-72 lg:w-72"
              />
              <div className="w-full min-w-0 rounded-2xl border border-[#2A2140]/5 bg-white px-4 py-3 text-sm leading-relaxed text-pretty text-[#2A2140] shadow-sm sm:px-5 sm:py-4 sm:text-base">
                <p className="font-semibold">Hej, jag heter Flow 💜</p>
                <p className="text-[#6B647F]">
                  Jag håller reda på dagen. Du behöver bara göra en sak i taget.
                </p>
              </div>
            </div>
          </div>


        </div>

        <PhonePreview />
      </div>
    </section>
  );
}

function PhonePreview() {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PHONE_ITEMS.map((it) => [it.l, it.done])),
  );
  const [say, setSay] = useState<{ text: string; key: number }>({ text: PHONE_IDLE, key: 0 });

  const react = (text: string) => setSay((s) => ({ text, key: s.key + 1 }));

  const toggle = (label: string) => {
    const next = !done[label];
    setDone((d) => ({ ...d, [label]: next }));
    const pool = next ? PHONE_DONE_REACTIONS : PHONE_UNDONE_REACTIONS;
    react(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] pt-6 pb-8 sm:max-w-[380px]">
      <div className="pointer-events-none absolute inset-x-6 top-10 bottom-10 rounded-[3rem] bg-[#7C5CE0]/20 blur-3xl" />

      {/* Telefon */}
      <div className="relative rounded-[2.6rem] border border-[#2A2140]/10 bg-[#2A2140] p-2.5 shadow-2xl shadow-[#7C5CE0]/25">
        <div className="overflow-hidden rounded-[2.1rem] bg-[#FBF9FF]">
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold text-[#6B647F]">
            <span>08:15</span>
            <span>MyFlove</span>
          </div>

          <div className="space-y-3 px-4 pt-2 pb-5">
            <div className="rounded-2xl border border-[#2A2140]/5 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold tracking-widest text-[#7C5CE0] uppercase">
                Mitt batteri
              </p>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EDE7FB]">
                <div className="h-full w-[58%] rounded-full bg-gradient-to-r from-[#A78BFA] to-[#7C5CE0]" />
              </div>
              <p className="mt-2 text-xs text-[#6B647F]">
                Halvfullt. Räcker till det viktigaste – inte till allt.
              </p>
            </div>

            <div className="rounded-2xl border border-[#7C5CE0]/15 bg-[#F1ECFC] p-3">
              <div className="flex items-start gap-2">
                <FlowMascot size="xs" mood="bounce" />
                <p
                  key={say.key}
                  className="pop-in text-xs leading-relaxed text-[#2A2140]"
                  aria-live="polite"
                >
                  {say.text}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {PHONE_ITEMS.map((it, i) => {
                const isDone = done[it.l];
                return (
                  <button
                    key={it.l}
                    type="button"
                    onClick={() => toggle(it.l)}
                    onMouseEnter={() => react(it.r)}
                    onFocus={() => react(it.r)}
                    aria-pressed={isDone}
                    className="press pop-in flex w-full items-center gap-3 rounded-2xl border border-[#2A2140]/5 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-[#7C5CE0]/30"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <span className="text-base">{it.e}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${isDone ? "text-[#6B647F] line-through" : "text-[#2A2140]"}`}
                      >
                        {it.l}
                      </p>
                      <p className="text-[11px] text-[#6B647F]">{it.t}</p>
                    </div>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs transition ${
                        isDone
                          ? "bg-[#7C5CE0] text-white"
                          : "border border-[#2A2140]/15 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Liten Flow bredvid telefonen */}
      <FlowMascot
        size="md"
        mood="sway"
        className="absolute -right-2 -bottom-2 sm:-right-6"
        alt="Flow vid telefonen"
      />



      {/* Flytande kort */}
      <FloatCard
        className="-top-2 -left-3 sm:-left-10"
        delay="0ms"
        time="08:02"
        onReact={() => react("Paraplyet ligger vid dörren – jag la det där i tanken åt dig. ☔")}
      >
        ☔ Det regnar idag. Paraplyet ligger vid dörren.
      </FloatCard>
      <FloatCard
        className="top-1/3 -left-4 sm:-left-16"
        delay="600ms"
        time="09:00"
        onReact={() => react("Fokustid startar. Jag är tyst tills pausen. 🎯")}
      >
        🎯 Fokustid · 42 minuter
      </FloatCard>
      <FloatCard
        className="-bottom-4 left-2 sm:-left-8"
        delay="1100ms"
        time="12:30"
        onReact={() => react("Du gjorde mer än du tror idag. +8 Flow 💜")}
      >
        😊 Bra jobbat! +8 Flow
      </FloatCard>
    </div>
  );
}

function FloatCard({
  children,
  className,
  time,
  delay,
  onReact,
}: {
  children: React.ReactNode;
  className?: string;
  time: string;
  delay: string;
  onReact?: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onReact}
      onFocus={onReact}
      onClick={onReact}
      className={`pop-in floaty press absolute z-10 hidden max-w-[190px] rounded-2xl border border-[#2A2140]/5 bg-white/95 px-3 py-2 text-left shadow-lg backdrop-blur transition hover:border-[#7C5CE0]/30 sm:block ${className}`}
      style={{ animationDelay: delay }}
    >
      <p className="text-[10px] font-semibold tracking-widest text-[#7C5CE0] uppercase">{time}</p>
      <p className="mt-1 text-xs leading-snug text-[#2A2140]">{children}</p>
    </button>
  );
}

/* ── Vad behöver du just nu? ──────────────────────────────── */

function NeedSection() {
  const [active, setActive] = useState<string>("overwhelmed");
  const need = NEEDS.find((n) => n.id === active) ?? NEEDS[0];

  return (
    <section id="sa-funkar-det" className="scroll-mt-8 bg-[#F1ECFC] px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">Prova Flow</p>
        <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          Vad behöver du just nu?
        </h2>
        <p className="mt-4 max-w-xl text-[#6B647F]">
          Välj det som stämmer – Flow svarar som i appen. Det här är en demo med exempeldata.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {NEEDS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActive(n.id)}
              className={`press rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                n.id === active
                  ? "border-[#7C5CE0] bg-[#7C5CE0] text-white shadow-md shadow-[#7C5CE0]/25"
                  : "border-[#2A2140]/10 bg-white text-[#2A2140] hover:border-[#7C5CE0]/40"
              }`}
              aria-pressed={n.id === active}
            >
              <span className="mr-1.5">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div key={need.id} className="pop-in mt-8 space-y-4">
          <FlowSays size="md" mood="nod">
            <p className="text-base leading-relaxed">{need.reply}</p>
          </FlowSays>

          <div className="grid gap-3 sm:grid-cols-3">
            {need.steps.map((s, i) => (
              <div
                key={s}
                className="pop-in rounded-3xl border border-[#2A2140]/5 bg-white p-5 shadow-sm"
                style={{ animationDelay: `${120 + i * 110}ms` }}
              >
                <div className="font-display grid h-8 w-8 place-items-center rounded-full bg-[#F1ECFC] text-sm font-bold text-[#7C5CE0]">
                  {i + 1}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#2A2140]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Dagens Flow ──────────────────────────────────────────── */

function DailyFlow() {
  // Samma startvärde på server och klient för stabil hydrering.
  const initial = 0;
  const [i, setI] = useState(0);
  const quote = DAILY_FLOWS[(initial + i) % DAILY_FLOWS.length];

  return (
    <section className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#7C5CE0]/15 bg-gradient-to-br from-white to-[#F4EFFE] p-7 text-center shadow-sm sm:p-10">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">
          Dagens Flow 💜
        </p>
        <FlowMascot size="md" mood="calm" glow className="mt-5" />
        <p
          key={quote}
          className="font-display pop-in mx-auto mt-5 max-w-xl text-2xl leading-snug font-bold text-[#2A2140] italic sm:text-3xl"
        >
          "{quote}"
        </p>
        <p className="mt-3 text-sm text-[#6B647F]">— Flow</p>
        <button
          type="button"
          onClick={() => setI((v) => v + 1)}
          className="press mt-6 rounded-full border border-[#7C5CE0]/25 bg-white px-5 py-2 text-sm font-semibold text-[#7C5CE0] hover:bg-[#F1ECFC]"
        >
          Ge mig en till
        </button>
      </div>
    </section>
  );
}

/* ── FlowScore ────────────────────────────────────────────── */

function FlowScoreSection() {
  return (
    <section className="px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">
            FlowScore™
          </p>
          <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl">
            Ett mått på belastning. Inte på prestation.
          </h2>
          <p className="mt-4 leading-relaxed text-[#6B647F]">
            FlowScore visar hur mycket du bär just nu. Du behöver inte öka poängen – vi ska minska
            belastningen.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#2A2140]/5 bg-white p-7 shadow-sm">
          <div className="flex items-end gap-3">
            <span className="font-display text-6xl leading-none font-bold text-[#7C5CE0]">42</span>
            <span className="pb-2 text-sm font-semibold text-[#6B647F]">FlowScore</span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#EDE7FB]">
            <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-[#F5B8D0] to-[#7C5CE0]" />
          </div>
          <div className="mt-5">
            <FlowSays mood="pulse">
              <p>Du behöver inte öka poängen.</p>
              <p className="text-[#6B647F]">Vi ska minska belastningen.</p>
            </FlowSays>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── En MyFlove-dag ───────────────────────────────────────── */

function DaySection() {
  const [active, setActive] = useState(0);
  const point = TIMELINE[active];

  return (
    <section className="bg-[#F1ECFC] px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">En dag</p>
        <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          Så ser en MyFlove-dag ut.
        </h2>
        <p className="mt-4 max-w-xl text-[#6B647F]">
          Tryck på en punkt – Flow berättar vad som händer där.
        </p>

        <div className="-mx-5 mt-10 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          <div className="relative flex min-w-max items-start gap-3">
            <div className="absolute top-[13px] right-3 left-3 h-px bg-[#7C5CE0]/20" />
            {TIMELINE.map((p, i) => (
              <button
                key={p.t}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="relative z-10 w-[124px] text-left"
                aria-pressed={i === active}
              >
                <span
                  className={`block h-[26px] w-[26px] rounded-full border-4 transition ${
                    i === active
                      ? "scale-110 border-[#7C5CE0] bg-white"
                      : "border-[#C4B5FD] bg-[#F1ECFC]"
                  }`}
                />
                <span className="mt-3 block text-xs font-semibold text-[#7C5CE0]">{p.t}</span>
                <span className="mt-1 block text-sm font-semibold text-[#2A2140]">{p.l}</span>
              </button>
            ))}
          </div>
        </div>

        <div key={point.t} className="pop-in mt-8 max-w-xl">
          <FlowSays size="md" mood="sway">
            <p className="text-[11px] font-semibold tracking-widest text-[#7C5CE0] uppercase">
              {point.t}
            </p>
            <p className="mt-1 text-base leading-relaxed">{point.c}</p>
            <p className="mt-2 inline-block rounded-full bg-[#F1ECFC] px-3 py-1 text-xs font-semibold text-[#7C5CE0]">
              {point.m}
            </p>
          </FlowSays>
        </div>
      </div>
    </section>
  );
}

/* ── Flow talar ───────────────────────────────────────────── */

function FlowVoice() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">Flow talar</p>
        <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          Som en vän i fickan.
        </h2>
        <p className="mt-4 max-w-xl text-[#6B647F]">
          Flow är lugn, empatisk och mänsklig. Aldrig tjatig, aldrig skuldbeläggande.
        </p>

        <div className="mt-10 max-w-2xl space-y-5">
          <FlowSays size="sm" mood="wave">
            <p>God morgon 💙</p>
            <p>Det ser ut att bli regn idag. Ta gärna med ett paraply.</p>
            <p>Glöm inte din medicin innan du går hemifrån.</p>
          </FlowSays>
          <FlowSays size="sm" mood="nod">
            <p>Jag ser att du har mycket idag.</p>
            <p>Ska vi börja med de tre viktigaste sakerna?</p>
          </FlowSays>
          <FlowSays size="sm" mood="calm">
            <p>Det blev mycket idag.</p>
            <p>Vi tar en sak i taget – börja med den enklaste.</p>
          </FlowSays>
        </div>
      </div>
    </section>
  );
}

/* ── Moduler ──────────────────────────────────────────────── */

function Modules() {
  return (
    <section className="bg-[#F1ECFC] px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">
          Allt hänger ihop
        </p>
        <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          En hjärna. Inte sju appar.
        </h2>
        <p className="mt-4 max-w-2xl text-[#6B647F]">
          Kalender, ekonomi, hälsa, relationer, inköp, ärenden och FlowPlan™ är inte separata
          funktioner. Flow läser av allt – och hjälper dig med helheten.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { i: "📅", l: "Kalender" },
            { i: "💳", l: "Ekonomi" },
            { i: "💜", l: "Hälsa" },
            { i: "👪", l: "Relationer" },
            { i: "🛒", l: "Inköp" },
            { i: "✓", l: "Ärenden" },
            { i: "🗺️", l: "FlowPlan™" },
            { i: "✦", l: "Flow AI" },
          ].map((m, i) => (
            <div
              key={m.l}
              className="pop-in rounded-2xl border border-[#2A2140]/5 bg-white p-4 text-center shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-2xl">{m.i}</div>
              <div className="mt-1 text-sm font-semibold text-[#2A2140]">{m.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-2xl">
          <FlowSays size="sm" mood="think">
            <p className="italic">
              "Jag såg att du har läkarbesök 14:00, saknar mjölk hemma, och att banken drar hyran
              imorgon. Ska jag flytta träningen?"
            </p>
          </FlowSays>
        </div>
      </div>
    </section>
  );
}

/* ── FlowPlan ─────────────────────────────────────────────── */

function FlowPlanSection() {
  return (
    <section className="relative overflow-hidden bg-[#2A2140] px-5 py-16 text-[#FBF9FF] sm:px-6 sm:py-24">
      <div className="pointer-events-none absolute -top-32 -left-20 h-[300px] w-[300px] rounded-full bg-[#F5B8D0] opacity-20 blur-2xl" />
      <div className="relative mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-[#F5B8D0] uppercase">FlowPlan™</p>
        <h2 className="font-display mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
          Rätt sak, i rätt ordning.
        </h2>
        <p className="mt-4 max-w-xl text-white/70">
          Du säger vad som ska göras. Flow räknar ut den mest effektiva ordningen – och förklarar
          varför.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">
              Du behöver
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Duscha", "Starta tvättmaskinen", "Laga middag", "Starta robotdammsugaren"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-[#F5B8D0] uppercase">
              Flow föreslår
            </p>
            <div className="mt-3 space-y-2">
              {[
                { n: 1, s: "Starta tvättmaskinen", w: "Går själv medan du gör annat.", t: "0 min" },
                { n: 2, s: "Starta robotdammsugaren", w: "Städar medan du duschar.", t: "1 min" },
                { n: 3, s: "Duscha", w: "Lugn stund. Ingen väntar på dig.", t: "5 min" },
                {
                  n: 4,
                  s: "Laga middag",
                  w: "Tvätten färdig snart – hänger efter maten.",
                  t: "25 min",
                },
              ].map((st) => (
                <div
                  key={st.n}
                  className="pop-in flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                  style={{ animationDelay: `${st.n * 90}ms` }}
                >
                  <div className="font-display flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#7C5CE0] font-bold text-white">
                    {st.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{st.s}</div>
                    <div className="text-xs text-white/60">{st.w}</div>
                  </div>
                  <div className="flex-shrink-0 rounded-md bg-[#F5B8D0]/10 px-2 py-1 text-[11px] font-semibold text-[#F5B8D0]">
                    {st.t}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Byggs just nu ────────────────────────────────────────── */

function BuildingSection() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#7C5CE0]/15 bg-white p-7 shadow-sm sm:p-10">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <FlowMascot size="xl" mood="cheer" glow className="mx-auto" />
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-[#7C5CE0] uppercase">
              🚀 Var med från början
            </p>
            <h2 className="font-display mt-3 text-2xl leading-tight font-bold sm:text-3xl">
              💜 Byggs just nu – för verkliga vardagar
            </h2>
            <p className="mt-4 leading-relaxed text-[#6B647F]">
              MyFlove utvecklas för att skapa ett smartare och mer mänskligt sätt att få stöd i
              vardagen. Du kan vara med tidigt och forma hur Flow fungerar.
            </p>
            <Button
              asChild
              size="lg"
              className="press mt-6 rounded-full bg-[#7C5CE0] text-white shadow-lg shadow-[#7C5CE0]/25 hover:bg-[#6A48CE]"
            >
              <Link to="/sign-up">Testa MyFlove gratis</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Vision ───────────────────────────────────────────────── */

function Vision() {
  return (
    <section className="relative overflow-hidden bg-[#2A2140] px-5 py-16 text-[#FBF9FF] sm:px-6 sm:py-24 md:py-32">
      <div className="pointer-events-none absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-[#7C5CE0] opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-40 h-[460px] w-[460px] rounded-full bg-[#C4B5FD] opacity-20 blur-2xl" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mt-6 text-xs font-semibold tracking-[0.4em] text-[#F5B8D0] uppercase">
          Vår vision
        </p>
        <h2 className="font-display mt-6 text-3xl leading-[1.05] font-bold tracking-tight sm:text-4xl md:text-6xl">
          Vi bygger inte funktioner.
          <br />
          Vi löser vardagsfriktion.
        </h2>
        <p className="font-display mt-6 text-2xl text-[#A78BFA] italic md:text-3xl">
          Bär mindre. Gör inte mer.
        </p>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
          Du öppnar inte en app. Du möter Flow – en lugn, intelligent följeslagare som hjälper dig
          genom vardagen.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="press rounded-full bg-[#7C5CE0] text-white shadow-lg shadow-[#7C5CE0]/30 hover:bg-[#6A48CE]"
          >
            <Link to="/sign-up">Möt Flow</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="press rounded-full border-white/25 bg-white/10 text-white hover:bg-white/20"
          >
            <Link to="/sign-in">Jag har redan konto</Link>
          </Button>
        </div>
        <div className="mx-auto mt-6 max-w-sm">
          <PwaInstallButton
            variant="outline"
            className="border-white/25 bg-white/10 text-white hover:bg-white/20"
          />
          <p className="mt-2 text-xs text-white/60">Ha Flow nära till hands 💜</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#2A2140] px-6 py-8 text-white/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
        <p>© {new Date().getFullYear()} MyFlove</p>
        <nav className="flex gap-5">
          <Link to="/integritet" className="hover:text-white">
            Integritet
          </Link>
          <Link to="/villkor" className="hover:text-white">
            Villkor
          </Link>
          <Link to="/cookies" className="hover:text-white">
            Cookies
          </Link>
        </nav>
      </div>
    </footer>
  );
}
