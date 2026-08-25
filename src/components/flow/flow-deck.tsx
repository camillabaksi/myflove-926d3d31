import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickCheckin from "@/components/quick-checkin";
import EnergyBattery from "@/components/energy-battery";
import FocusMode from "@/components/focus-mode";
import { FlowMascot } from "@/components/flow-mascot";
import { useTasks } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { assessToday, rankNow, suggestNow } from "@/lib/flow-engine";
import { energySentence, pickFlowSlides, type FlowSlideId } from "@/lib/flow-slides";
import type { ScoredTask } from "@/lib/daily-flow";
import { BUILD_ID } from "@/lib/cache-busting";

/** Versionsmärkning för Flow-presentationen – visas i UI för verifiering. */
export const FLOW_VERSION = "swipe-keyboard-2026-08-25";

type DeckSlideId = "intro" | FlowSlideId;

/** Klartextnamn för skärmläsare och prickarnas etiketter. */
const SLIDE_LABELS: Record<DeckSlideId, string> = {
  intro: "Flow presenterar sig",
  checkin: "Hur är det just nu?",
  energy: "Din energi",
  suggestion: "Förslag just nu",
  rest: "Återhämtning",
};




/**
 * Flow 2.0 – en sak i taget.
 * En state-baserad vy: exakt EN slide finns i DOM:en åt gången.
 * Sliderna kommer från befintlig Flow-logik (flow-engine + Mitt batteri +
 * dagens incheckning). Inga nya datamodeller, inga parallella system.
 */
export default function FlowDeck() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { reading, items } = useEnergyBattery();
  const { moodValue, energyValue } = useQuickCheckin();

  const [skip, setSkip] = useState<string[]>([]);
  const [focusOpen, setFocusOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; time: number; axis: "none" | "x" | "y" } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const activeSlideRef = useRef<HTMLDivElement | null>(null);
  const shouldFocusSlide = useRef(false);


  const suggestion = useMemo(
    () =>
      suggestNow({
        tasks: activeTasks,
        batteryNow: reading.now,
        peakLabel: reading.peak?.label ?? null,
        skip,
      }),
    [activeTasks, reading.now, reading.peak, skip],
  );

  const scored = useMemo<ScoredTask | null>(() => {
    if (!suggestion.task) return null;
    const ranked = rankNow({ tasks: activeTasks, batteryNow: reading.now, skip });
    return ranked.find((r) => r.task.id === suggestion.task?.id) ?? null;
  }, [suggestion.task, activeTasks, reading.now, skip]);

  const load = useMemo(() => assessToday(reading, items), [reading, items]);

  const slides = useMemo<DeckSlideId[]>(
    () => [
      "intro",
      ...pickFlowSlides({
        hasCheckin: moodValue != null && energyValue != null,
        batteryNow: reading.now,
        overloaded: reading.overloaded,
        hasSuggestion: Boolean(suggestion.task),
        heavyDay: load.weight === "tung",
      }),
    ],
    [moodValue, energyValue, reading.now, reading.overloaded, suggestion.task, load.weight],
  );

  // Läs önskad startslide från URL:en (?slide=2 eller ?slide=suggestion / #slide=2)
  const requestedSlide = useRef<string | null>(
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("slide") ??
        new URLSearchParams(window.location.hash.replace(/^#/, "")).get("slide"),
  );
  const appliedInitial = useRef(false);

  useEffect(() => {
    if (appliedInitial.current || slides.length === 0) return;
    const raw = requestedSlide.current;
    if (!raw) {
      appliedInitial.current = true;
      return;
    }
    const numeric = Number(raw);
    let index = -1;
    if (Number.isFinite(numeric) && raw.trim() !== "") {
      // 1-baserat i URL:en för att matcha "slide 1 av N" i UI:t
      index = Math.round(numeric) - 1;
    } else {
      index = slides.indexOf(raw as DeckSlideId);
    }
    if (index >= 0) {
      setCurrentSlide(Math.max(0, Math.min(slides.length - 1, index)));
      appliedInitial.current = true;
    }
  }, [slides]);

  useEffect(() => {
    setCurrentSlide((value) => Math.min(value, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const goTo = (nextSlide: number, focusSlide = false) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, nextSlide));
    if (focusSlide && clamped !== currentSlide) shouldFocusSlide.current = true;
    setCurrentSlide(clamped);
  };

  const next = (focusSlide = false) => goTo(currentSlide + 1, focusSlide);
  const previous = (focusSlide = false) => goTo(currentSlide - 1, focusSlide);
  const activeSlide = slides[currentSlide] ?? "intro";

  // Håll URL:en i synk så att en delad/laddad länk landar på samma slide
  useEffect(() => {
    if (typeof window === "undefined" || !appliedInitial.current) return;
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(currentSlide + 1));
    window.history.replaceState(null, "", url.toString());
  }, [currentSlide, activeSlide]);

  // Flytta fokus till den nya sliden vid tangentbordsnavigering
  useEffect(() => {
    if (!shouldFocusSlide.current) return;
    shouldFocusSlide.current = false;
    activeSlideRef.current?.focus({ preventScroll: true });
  }, [currentSlide]);

  /** Drag ska inte starta på knappar, reglage eller fält. */
  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, [role='slider'], [contenteditable]"));

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (slides.length < 2 || isInteractive(event.target)) return;
    drag.current = { x: event.clientX, y: event.clientY, time: Date.now(), axis: "none" };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (state.axis === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (state.axis === "y") {
        drag.current = null;
        return;
      }
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    // Motstånd vid kanterna
    const atStart = currentSlide === 0 && dx > 0;
    const atEnd = currentSlide === slides.length - 1 && dx < 0;
    setDragOffset(atStart || atEnd ? dx * 0.25 : dx);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    const offset = dragOffset;
    setDragging(false);
    setDragOffset(0);
    if (!state || state.axis !== "x") return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const width = viewportRef.current?.clientWidth ?? 1;
    const elapsed = Date.now() - state.time;
    const quickSwipe = elapsed < 300 && Math.abs(offset) > 40;
    if (Math.abs(offset) > width * 0.2 || quickSwipe) {
      if (offset < 0) next();
      else previous();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive(event.target)) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next(true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous(true);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(slides.length - 1, true);
    }
  };


  return (
    <section
      aria-label="Flow"
      className="surface-card relative w-full overflow-hidden p-4 sm:p-6"
      data-flow-version={FLOW_VERSION}
      data-flow-current-slide={currentSlide}
    >
      <div
        ref={viewportRef}
        data-flow-viewport
        tabIndex={0}
        role="group"
        aria-roledescription="karusell"
        aria-label={`Flow – vy ${currentSlide + 1} av ${slides.length}`}
        aria-describedby="flow-karusell-hjalp"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative w-full overflow-hidden rounded-2xl outline-none touch-pan-y focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ cursor: dragging ? "grabbing" : undefined }}
      >
        <div
          data-flow-track
          className={`flex w-full flex-row items-start ${
            dragging ? "" : "transition-transform duration-300 ease-out motion-reduce:transition-none"
          }`}
          style={{ transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))` }}
        >
          {slides.map((id, i) => {
            const active = i === currentSlide;
            return (
              <div
                key={`${id}-${i}`}
                ref={active ? activeSlideRef : undefined}
                data-flow-slide
                data-flow-slide-id={id}
                data-flow-slide-active={active ? "true" : "false"}
                aria-hidden={!active}
                inert={!active}
                tabIndex={active ? -1 : undefined}
                aria-label={`${SLIDE_LABELS[id]} – vy ${i + 1} av ${slides.length}`}
                className="w-full min-w-full shrink-0 grow-0 basis-full outline-none"
              >
                <FlowSlide
                  id={id}
                  reading={reading}
                  suggestion={suggestion}
                  onIntroNext={() => next()}
                  onStart={() => setFocusOpen(true)}
                  onLater={() => {
                    const taskId = suggestion.task?.id;
                    if (taskId) setSkip((value) => [...value, taskId]);
                  }}
                  onDone={() => suggestion.task && toggleTask(suggestion.task.id)}
                  onMoveTomorrow={() => suggestion.task && snoozeTask(suggestion.task.id, 1)}
                  onSkipSlide={() => next()}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p id="flow-karusell-hjalp" className="sr-only">
        Svep i sidled eller använd vänster- och högerpil för att byta vy. Home går till första vyn
        och End till den sista.
      </p>
      <p className="sr-only" aria-live="polite">
        {`Vy ${currentSlide + 1} av ${slides.length}: ${SLIDE_LABELS[activeSlide]}`}
      </p>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Föregående vy"
            onClick={() => previous()}
            disabled={currentSlide === 0}
            className="press min-h-11 min-w-11 rounded-full text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="flex items-center gap-1.5" role="group" aria-label="Välj vy">
            {slides.map((id, i) => (
              <Button
                key={`${id}-${i}`}
                type="button"
                variant="ghost"
                aria-label={`Vy ${i + 1} av ${slides.length}: ${SLIDE_LABELS[id]}`}
                aria-current={i === currentSlide}
                onClick={() => goTo(i)}
                className={`h-2 min-h-0 rounded-full p-0 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  i === currentSlide ? "w-5 bg-primary" : "w-2 bg-border"
                }`}
              />
            ))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Nästa vy"
            onClick={() => next()}
            disabled={currentSlide === slides.length - 1}
            className="press min-h-11 min-w-11 rounded-full text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}


      <FlowVersionBadge currentSlide={currentSlide} />

      <FocusMode
        item={scored}
        open={focusOpen}
        onOpenChange={setFocusOpen}
        onDone={(item) => {
          toggleTask(item.task.id);
          setFocusOpen(false);
        }}
        onNext={() => {
          const taskId = suggestion.task?.id;
          if (taskId) setSkip((value) => [...value, taskId]);
        }}
      />
    </section>
  );
}

/* ── Versionsstämpel: verifiera i realtid vilken bundle mobilen kör ── */

function FlowVersionBadge({
  currentSlide,
}: {
  currentSlide: number;
}) {
  const [domVersion, setDomVersion] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const section = document.querySelector("[data-flow-version]");
    setDomVersion(section?.getAttribute("data-flow-version") ?? null);
    setSlideCount(section?.querySelectorAll("[data-flow-slide]").length ?? 0);
    setVisibleCount(
      section?.querySelectorAll('[data-flow-slide][data-flow-slide-active="true"]').length ?? 0,
    );
  }, [currentSlide]);

  return (
    <p
      data-flow-version-badge
      className="mt-3 text-center text-[10px] leading-tight text-muted-foreground/70"
    >
      Flow {domVersion ?? FLOW_VERSION} · build {BUILD_ID} · slide {currentSlide + 1} av{" "}
      {slideCount} · {visibleCount === 1 ? "en synlig slide ✓" : `${visibleCount} synliga ✗`}
    </p>
  );

}


/* ── En slide i taget ───────────────────────────────────────────── */

function FlowSlide({
  id,
  reading,
  suggestion,
  onIntroNext,
  onStart,
  onLater,
  onDone,
  onMoveTomorrow,
  onSkipSlide,
}: {
  id: DeckSlideId;
  reading: ReturnType<typeof useEnergyBattery>["reading"];
  suggestion: ReturnType<typeof suggestNow>;
  onIntroNext: () => void;
  onStart: () => void;
  onLater: () => void;
  onDone: () => void;
  onMoveTomorrow: () => void;
  onSkipSlide: () => void;
}) {
  if (id === "intro") {
    return (
      <div className="flex min-h-[28rem] flex-col items-center justify-center gap-5 p-4 text-center">
        <FlowMascot size="xl" glow float className="flow-entry" />
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink">Hej! Jag är Flow 💜</h2>
          <p className="mx-auto max-w-xs text-base leading-relaxed text-muted-foreground">
            Jag hjälper dig hitta vad som passar bäst just nu.
          </p>
        </div>
        <Button className="rounded-2xl px-7" onClick={onIntroNext}>
          Visa mig
        </Button>
        <p className="text-xs text-muted-foreground">Svep åt sidan för att se mer →</p>
      </div>
    );
  }

  if (id === "checkin") {
    return (
      <SlideShell title="❤️ Hur är det just nu?" note="Det räcker att dra och trycka Logga.">
        <QuickCheckin />
      </SlideShell>
    );
  }

  if (id === "energy") {
    return (
      <SlideShell title="🔋 Din energi" note={energySentence(reading.now, reading.trend)}>
        <EnergyBattery />
      </SlideShell>
    );
  }

  if (id === "rest") {
    return (
      <SlideShell title="🌱 Kanske är det dags att pausa">
        <p className="text-base leading-relaxed text-foreground">
          Du har redan gjort mycket idag. En kort paus kan vara ett bra nästa steg.
        </p>
        <p className="text-sm text-muted-foreground">Det är okej att göra mindre just nu.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-2xl">
            <Link href="/pomodoro">Ta paus</Link>
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={onSkipSlide}>
            Inte nu
          </Button>
        </div>
      </SlideShell>
    );
  }

  // suggestion
  if (!suggestion.task) {
    return (
      <SlideShell title="🎯 Mitt förslag">
        <p className="text-base leading-relaxed text-foreground">{suggestion.headline}</p>
        <p className="text-sm text-muted-foreground">
          Inget behöver göras just nu. Det räcker att bara vara idag. 💙
        </p>
      </SlideShell>
    );
  }

  return (
    <SlideShell title="🎯 Jag tror att det här passar bra nu">
      <div className="rounded-2xl bg-secondary/40 p-4">
        <p className="font-display text-xl text-ink">{suggestion.task.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {suggestion.reason} Ungefär {suggestion.minutes} min.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onStart} className="rounded-2xl">
          Gör nu
        </Button>
        <Button variant="outline" className="rounded-2xl" onClick={onLater}>
          Senare
        </Button>
        <Button variant="ghost" className="rounded-2xl" onClick={onLater}>
          Visa något annat
        </Button>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <button type="button" onClick={onDone} className="underline-offset-2 hover:underline">
          <Check size={12} className="mr-1 inline" /> Redan klar
        </button>
        <button
          type="button"
          onClick={onMoveTomorrow}
          className="underline-offset-2 hover:underline"
        >
          Flytta till imorgon
        </button>
      </div>
    </SlideShell>
  );
}

function SlideShell({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[28rem] flex-col justify-center gap-4 p-1 sm:p-3">
      <div className="flex items-start gap-3">
        <FlowMascot size="xs" float />
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-snug text-ink">{title}</h2>
          {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
