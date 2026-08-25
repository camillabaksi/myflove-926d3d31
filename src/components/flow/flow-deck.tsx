import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FocusMode from "@/components/focus-mode";
import { FlowCharacter, isWetWeather, sceneForTask, type FlowScene } from "@/components/flow/flow-character";
import { useTasks } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useWeather } from "@/hooks/use-weather";
import { assessToday, rankNow, suggestNow } from "@/lib/flow-engine";
import { energySentence, pickFlowSlides, type FlowSlideId } from "@/lib/flow-slides";
import type { ScoredTask } from "@/lib/daily-flow";
import { BUILD_ID } from "@/lib/cache-busting";
import { haptic } from "@/lib/haptics";

/** Versionsmärkning för Flow-presentationen – visas i UI för verifiering. */
export const FLOW_VERSION = "flow-2.0-character-2026-08-25";

type DeckSlideId = "intro" | "weather" | FlowSlideId | "done";

/** Klartextnamn för skärmläsare och prickarnas etiketter. */
const SLIDE_LABELS: Record<DeckSlideId, string> = {
  intro: "Flow hälsar",
  weather: "Vädret idag",
  checkin: "Hur är det just nu?",
  energy: "Din energi",
  suggestion: "Förslag just nu",
  rest: "Återhämtning",
  done: "Klart!",
};

/**
 * Flow 2.0 – en levande karaktär, en sak i taget.
 * Exakt EN slide renderas åt gången. All data kommer från befintlig
 * Flow-logik (flow-engine, Mitt batteri, dagens incheckning, väder).
 */
export default function FlowDeck() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { reading, items } = useEnergyBattery();
  const { moodValue, energyValue, logMood, logEnergy } = useQuickCheckin();
  const weather = useWeather();

  const [skip, setSkip] = useState<string[]>([]);
  const [focusOpen, setFocusOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
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
  const rainy = isWetWeather(weather?.code);

  const slides = useMemo<DeckSlideId[]>(() => {
    const base = pickFlowSlides({
      hasCheckin: moodValue != null && energyValue != null,
      batteryNow: reading.now,
      overloaded: reading.overloaded,
      hasSuggestion: Boolean(suggestion.task),
      heavyDay: load.weight === "tung",
    });
    return ["intro", ...(rainy ? (["weather"] as DeckSlideId[]) : []), ...base];
  }, [moodValue, energyValue, reading.now, reading.overloaded, suggestion.task, load.weight, rainy]);

  // Läs önskad startslide från URL:en (?slide=2 eller ?slide=suggestion)
  const requestedSlide = useRef<string | null>(
    typeof window === "undefined"
      ? null
      : (new URLSearchParams(window.location.search).get("slide") ??
        new URLSearchParams(window.location.hash.replace(/^#/, "")).get("slide")),
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
    if (clamped === currentSlide) {
      // Redan längst ut – en liten stöt i stället för ett vybyte.
      if (nextSlide !== currentSlide) haptic("bump");
      return;
    }
    if (focusSlide) shouldFocusSlide.current = true;
    haptic("tap");
    setCelebrating(false);
    setCurrentSlide(clamped);
  };


  const next = (focusSlide = false) => goTo(currentSlide + 1, focusSlide);
  const previous = (focusSlide = false) => goTo(currentSlide - 1, focusSlide);
  const activeSlide: DeckSlideId = celebrating ? "done" : (slides[currentSlide] ?? "intro");

  // Håll URL:en i synk så att en delad/laddad länk landar på samma slide
  useEffect(() => {
    if (typeof window === "undefined" || !appliedInitial.current) return;
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(currentSlide + 1));
    window.history.replaceState(null, "", url.toString());
  }, [currentSlide]);

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
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    setDragging(false);
    if (!state || state.axis !== "x") return;
    const dx = event.clientX - state.x;
    const width = viewportRef.current?.clientWidth ?? 1;
    const elapsed = Date.now() - state.time;
    const quickSwipe = elapsed < 300 && Math.abs(dx) > 40;
    if (Math.abs(dx) > width * 0.2 || quickSwipe) {
      if (dx < 0) next();
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

  const celebrate = () => {
    haptic("success");
    setCelebrating(true);
    window.setTimeout(() => {
      setCelebrating(false);
      setCurrentSlide((v) => Math.min(slides.length - 1, v + 1));
    }, 2200);
  };


  return (
    <section
      aria-label="Flow"
      className="surface-card relative w-full overflow-hidden p-3 sm:p-5"
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
        className="relative w-full overflow-hidden rounded-2xl outline-none touch-pan-y [overscroll-behavior-x:none] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ cursor: dragging ? "grabbing" : undefined }}
      >
        <div
          key={`${activeSlide}-${currentSlide}`}
          ref={activeSlideRef}
          data-flow-slide
          data-flow-slide-id={activeSlide}
          data-flow-slide-active="true"
          tabIndex={-1}
          aria-label={`${SLIDE_LABELS[activeSlide]} – vy ${currentSlide + 1} av ${slides.length}`}
          className="flow-entry w-full outline-none"
        >
          <FlowSlide
            id={activeSlide}
            seed={currentSlide}
            reading={reading}
            weather={weather}
            suggestion={suggestion}
            moodValue={moodValue}
            energyValue={energyValue}
            onLogMood={logMood}
            onLogEnergy={logEnergy}
            onNext={() => next()}
            onStart={() => setFocusOpen(true)}
            onLater={() => {
              const taskId = suggestion.task?.id;
              if (taskId) setSkip((value) => [...value, taskId]);
            }}
            onDone={() => {
              if (suggestion.task) toggleTask(suggestion.task.id);
              celebrate();
            }}
            onMoveTomorrow={() => suggestion.task && snoozeTask(suggestion.task.id, 1)}
          />
        </div>
      </div>

      <p id="flow-karusell-hjalp" className="sr-only">
        Svep i sidled eller använd vänster- och högerpil för att byta vy.
      </p>
      <p className="sr-only" aria-live="polite">
        {`Vy ${currentSlide + 1} av ${slides.length}: ${SLIDE_LABELS[activeSlide]}`}
      </p>

      {slides.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Föregående vy"
            onClick={() => previous()}
            disabled={currentSlide === 0}
            className="press min-h-11 min-w-11 rounded-full text-muted-foreground disabled:opacity-25"
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
            className="press min-h-11 min-w-11 rounded-full text-muted-foreground disabled:opacity-25"
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
          celebrate();
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

function FlowVersionBadge({ currentSlide }: { currentSlide: number }) {
  const [domVersion, setDomVersion] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    const section = document.querySelector("[data-flow-version]");
    setDomVersion(section?.getAttribute("data-flow-version") ?? null);
    setSlideCount(section?.querySelectorAll("[data-flow-slide]").length ?? 0);
  }, [currentSlide]);

  return (
    <p
      data-flow-version-badge
      className="mt-2 text-center text-[10px] leading-tight text-muted-foreground/70"
    >
      Flow {domVersion ?? FLOW_VERSION} · build {BUILD_ID} · vy {currentSlide + 1} ·{" "}
      {slideCount === 1 ? "en slide i DOM ✓" : `${slideCount} slides ✗`}
    </p>
  );
}

/* ── En slide i taget ───────────────────────────────────────────── */

function FlowSlide({
  id,
  seed,
  reading,
  weather,
  suggestion,
  moodValue,
  energyValue,
  onLogMood,
  onLogEnergy,
  onNext,
  onStart,
  onLater,
  onDone,
  onMoveTomorrow,
}: {
  id: DeckSlideId;
  seed: number;
  reading: ReturnType<typeof useEnergyBattery>["reading"];
  weather: ReturnType<typeof useWeather>;
  suggestion: ReturnType<typeof suggestNow>;
  moodValue: number | null;
  energyValue: number | null;
  onLogMood: (v: number) => void;
  onLogEnergy: (v: number) => void;
  onNext: () => void;
  onStart: () => void;
  onLater: () => void;
  onDone: () => void;
  onMoveTomorrow: () => void;
}) {
  if (id === "intro") {
    return (
      <SlideShell scene="hello" seed={seed} title="Hej! Jag är Flow 💜">
        <p className="text-sm text-muted-foreground">
          Jag hjälper dig hitta vad som passar bäst just nu.
        </p>
        <Button className="rounded-2xl px-7" onClick={onNext}>
          Visa mig →
        </Button>
      </SlideShell>
    );
  }

  if (id === "weather") {
    return (
      <SlideShell scene="rain" seed={seed} title="Det ser blött ut idag ☔">
        <p className="text-sm text-muted-foreground">
          {weather ? `${Math.round(weather.temperature)}° i ${weather.city}. ` : ""}
          Ta med paraply när du ska iväg.
        </p>
        <Button className="rounded-2xl px-7" onClick={onNext}>
          Okej!
        </Button>
      </SlideShell>
    );
  }

  if (id === "checkin") {
    return <CheckinSlide seed={seed} moodValue={moodValue} energyValue={energyValue} onLogMood={onLogMood} onLogEnergy={onLogEnergy} onNext={onNext} />;
  }

  if (id === "energy") {
    const scene: FlowScene =
      reading.now >= 66 ? "energyHigh" : reading.now < 20 ? "sleep" : reading.now < 40 ? "energyLow" : "mood";
    return (
      <SlideShell scene={scene} seed={seed} energy={reading.now} title={`Ditt batteri: ${Math.round(reading.now)} %`}>
        <p className="text-sm text-muted-foreground">
          {energySentence(reading.now, reading.trend)}
        </p>
        <Button className="rounded-2xl px-7" onClick={onNext}>
          Okej
        </Button>
      </SlideShell>
    );
  }

  if (id === "rest") {
    return (
      <SlideShell scene="rest" seed={seed} title="Kanske dags att pausa 🌱">
        <p className="text-sm text-muted-foreground">
          Du har gjort mycket idag. Det är okej att göra mindre nu.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild className="rounded-2xl">
            <Link href="/pomodoro">Ta paus</Link>
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={onNext}>
            Inte nu
          </Button>
        </div>
      </SlideShell>
    );
  }

  if (id === "done") {
    return (
      <SlideShell scene="done" seed={seed} title="Klart! Snyggt jobbat 🎉">
        <p className="text-sm text-muted-foreground">Det där räknas. Vi tar nästa när du vill.</p>
      </SlideShell>
    );
  }

  // suggestion
  if (!suggestion.task) {
    return (
      <SlideShell scene="think" seed={seed} title="Inget måste just nu">
        <p className="text-sm text-muted-foreground">
          Det räcker att bara vara idag. 💙
        </p>
      </SlideShell>
    );
  }

  return (
    <SlideShell
      scene={sceneForTask(suggestion.task.title)}
      seed={seed}
      title={suggestion.task.title}
    >
      <p className="text-sm text-muted-foreground">
        {suggestion.reason} Ungefär {suggestion.minutes} min.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onStart} className="rounded-2xl px-6">
          Gör nu
        </Button>
        <Button variant="outline" className="rounded-2xl" onClick={onLater}>
          Senare
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
        <button type="button" onClick={onDone} className="underline-offset-2 hover:underline">
          Redan klar
        </button>
        <button type="button" onClick={onMoveTomorrow} className="underline-offset-2 hover:underline">
          Flytta till imorgon
        </button>
      </div>
    </SlideShell>
  );
}

/** Kort incheckning – använder befintlig logg-logik, inget nytt datalager. */
function CheckinSlide({
  seed,
  moodValue,
  energyValue,
  onLogMood,
  onLogEnergy,
  onNext,
}: {
  seed: number;
  moodValue: number | null;
  energyValue: number | null;
  onLogMood: (v: number) => void;
  onLogEnergy: (v: number) => void;
  onNext: () => void;
}) {
  const [energy, setEnergy] = useState(energyValue ?? 5);
  const [mood, setMood] = useState(moodValue ?? 5);

  return (
    <SlideShell scene="mood" seed={seed} title="Hur är det just nu?">
      <div className="w-full max-w-xs space-y-3 text-left">
        <label className="block text-xs font-medium text-muted-foreground">
          ⚡ Ork: {energy}/10
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="myflove-range mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
            aria-label="Ork 1 till 10"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          ❤️ Mående: {mood}/10
          <input
            type="range"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="myflove-range mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
            aria-label="Mående 1 till 10"
          />
        </label>
      </div>
      <Button
        className="rounded-2xl px-7"
        onClick={() => {
          void onLogEnergy(energy);
          onLogMood(mood);
          onNext();
        }}
      >
        Logga
      </Button>
    </SlideShell>
  );
}

/** Gemensam ram: Flow stor högst upp, kort text och en åtgärd. */
function SlideShell({
  scene,
  seed,
  title,
  energy,
  children,
}: {
  scene: FlowScene;
  seed: number;
  title: string;
  energy?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[58svh] max-h-[560px] min-h-[360px] flex-col items-center justify-between gap-3 overflow-hidden px-2 py-3 text-center">
      <FlowCharacter scene={scene} seed={seed} energy={energy} />
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <h2 className="font-display text-xl leading-snug text-balance text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}
