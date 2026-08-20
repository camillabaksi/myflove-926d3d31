import { useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import FocusMode from "@/components/focus-mode";
import { AssistantContent } from "@/pages/assistant";
import { useTasks } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { assessToday, rankNow, suggestMove, suggestNow } from "@/lib/flow-engine";
import type { ScoredTask } from "@/lib/daily-flow";
import { MyFloveThinking, MyFloveTransition } from "@/components/myflove/motion";
import { Sparkles, Sun, MessageCircle, CalendarClock, Check } from "lucide-react";

type Layer = "nu" | "idag" | "hjalp";

const LAYERS: Array<{ id: Layer; label: string; icon: typeof Sparkles }> = [
  { id: "nu", label: "Nu", icon: Sparkles },
  { id: "idag", label: "Idag", icon: Sun },
  { id: "hjalp", label: "Hjälp", icon: MessageCircle },
];

/**
 * Flow – MyFloves hjälp att förstå vad som är bäst att göra nu.
 * Tre lugna lager: NU (ett svar), IDAG (dagens belastning) och HJÄLP (chatten).
 * All logik kommer från flow-engine – här finns bara presentation.
 */
export default function FlowPage() {
  const [layer, setLayer] = useState<Layer>("nu");

  return (
    <Layout>
      <div className="space-y-5">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink">
            <Sparkles className="h-7 w-7 text-primary" /> Flow
          </h1>
          <p className="mt-1 text-muted-foreground">
            Vad som är bäst att göra nu – och hur dagen kan bli lättare.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Flow-lager"
          className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1"
        >
          {LAYERS.map((l) => {
            const Icon = l.icon;
            const active = layer === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLayer(l.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-card text-ink shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Icon size={16} /> {l.label}
              </button>
            );
          })}
        </div>

        {layer === "nu" && <NowLayer />}
        {layer === "idag" && <TodayLayer />}
        {layer === "hjalp" && <AssistantContent />}
      </div>
    </Layout>
  );
}

/* ── NU ─────────────────────────────────────────────────────────── */

function NowLayer() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { reading } = useEnergyBattery();
  const [skip, setSkip] = useState<string[]>([]);
  const [focusOpen, setFocusOpen] = useState(false);

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
    return ranked.find((r) => r.task.id === suggestion.task!.id) ?? null;
  }, [suggestion.task, activeTasks, reading.now, skip]);

  if (!suggestion.task) {
    return (
      <section className="surface-card space-y-3 p-6 text-center">
        <MyFloveThinking />
        <p className="text-base text-foreground">{suggestion.headline}</p>
        <p className="text-sm text-muted-foreground">
          Inget behöver göras just nu. Det räcker att bara vara idag. 💙
        </p>
      </section>
    );
  }

  return (
    <MyFloveTransition transitionKey={suggestion.task.id}>
      <section className="surface-card space-y-4 p-6">
        <p className="text-base leading-relaxed text-foreground">{suggestion.headline}</p>

        <div className="rounded-2xl bg-secondary/40 p-4">
          <p className="font-display text-xl text-ink">{suggestion.task.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {suggestion.reason} Ungefär {suggestion.minutes} min.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setFocusOpen(true)} className="rounded-2xl">
            {suggestion.ctaLabel}
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setSkip((s) => [...s, suggestion.task!.id])}
          >
            Senare
          </Button>
          <Button
            variant="ghost"
            className="rounded-2xl"
            onClick={() => toggleTask(suggestion.task!.id)}
          >
            <Check size={16} className="mr-1.5" /> Redan klar
          </Button>
        </div>
      </section>

      <FocusMode
        item={scored}
        open={focusOpen}
        onOpenChange={setFocusOpen}
        onDone={(item) => {
          toggleTask(item.task.id);
          setFocusOpen(false);
        }}
        onNext={() => setSkip((s) => [...s, suggestion.task!.id])}
      />
      {/* Snooze finns kvar som mjukt alternativ, utan att ta plats visuellt. */}
      <button
        type="button"
        onClick={() => snoozeTask(suggestion.task!.id, 1)}
        className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Flytta den här till imorgon
      </button>
    </MyFloveTransition>
  );
}

/* ── IDAG ───────────────────────────────────────────────────────── */

function TodayLayer() {
  const { activeTasks, snoozeTask } = useTasks();
  const { reading, items } = useEnergyBattery();
  const [handled, setHandled] = useState(false);

  const load = useMemo(() => assessToday(reading, items), [reading, items]);
  const move = useMemo(
    () => suggestMove(load, reading, activeTasks),
    [load, reading, activeTasks],
  );

  return (
    <section className="surface-card space-y-4 p-6">
      <div className="flex items-start gap-2">
        <CalendarClock size={18} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-base leading-relaxed text-foreground">{load.summary}</p>
      </div>

      {reading.peak && (
        <p className="text-sm text-muted-foreground">
          Du har starkast fokus {reading.peak.label}
          {reading.dip ? ` och lägst ${reading.dip.label}` : ""}.
        </p>
      )}

      {move && !handled && (
        <div className="space-y-3 rounded-2xl bg-secondary/40 p-4">
          <p className="text-sm text-foreground">{move.text}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-2xl"
              onClick={() => {
                snoozeTask(move.task.id, 1);
                setHandled(true);
              }}
            >
              Flytta
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => setHandled(true)}>
              Behåll
            </Button>
          </div>
        </div>
      )}

      {handled && (
        <p className="text-sm text-muted-foreground">Tack. Dagen är uppdaterad. 💙</p>
      )}
    </section>
  );
}
