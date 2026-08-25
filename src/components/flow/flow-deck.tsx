import { useMemo, useRef, useState } from "react";
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

type DeckSlideId = "intro" | FlowSlideId;

/**
 * Flow 2.0 – en sak i taget.
 * En horisontell carousel: exakt EN slide syns åt gången, inget staplas vertikalt.
 * Sliderna kommer från befintlig Flow-logik (flow-engine + Mitt batteri +
 * dagens incheckning). Inga nya datamodeller, inga parallella system.
 */
export default function FlowDeck() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { reading, items } = useEnergyBattery();
  const { moodValue, energyValue } = useQuickCheckin();

  const [skip, setSkip] = useState<string[]>([]);
  const [focusOpen, setFocusOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

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

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    setIndex(clamped);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  const next = () => goTo(index + 1);

  return (
    <section
      aria-label="Flow"
      className="flow-carousel relative"
      data-flow-version="flex-nowrap-2026-08-25"
    >
      {/* Utility-klasser och egna regler låser samma kritiska geometri. */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        data-flow-track
        className="flow-carousel-track flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden"
      >
        {slides.map((id, i) => (
          <div
            key={`${id}-${i}`}
            data-flow-slide
            aria-hidden={i !== index}
            className="flow-carousel-slide block w-full min-w-full max-w-full shrink-0 grow-0 basis-full"
          >
            <FlowSlide
              id={id}
              reading={reading}
              suggestion={suggestion}
              onIntroNext={next}
              onStart={() => setFocusOpen(true)}
              onLater={() => {
                if (suggestion.task) setSkip((s) => [...s, suggestion.task.id]);
              }}
              onDone={() => suggestion.task && toggleTask(suggestion.task.id)}
              onMoveTomorrow={() => suggestion.task && snoozeTask(suggestion.task.id, 1)}
              onSkipSlide={next}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Föregående"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="press rounded-full p-1.5 text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="flex items-center gap-1.5">
            {slides.map((id, i) => (
              <button
                key={`${id}-${i}`}
                type="button"
                aria-label={`Gå till ${i + 1} av ${slides.length}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-2 bg-border"
                }`}
              />
            ))}
          </span>
          <button
            type="button"
            aria-label="Nästa"
            onClick={() => goTo(index + 1)}
            disabled={index === slides.length - 1}
            className="press rounded-full p-1.5 text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <FocusMode
        item={scored}
        open={focusOpen}
        onOpenChange={setFocusOpen}
        onDone={(item) => {
          toggleTask(item.task.id);
          setFocusOpen(false);
        }}
        onNext={() => suggestion.task && setSkip((s) => [...s, suggestion.task!.id])}
      />
    </section>
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
      <div className="surface-card flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
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
    <div className="surface-card flex min-h-full flex-col gap-4 p-5">
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
