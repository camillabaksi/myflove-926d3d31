import { useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import FocusMode from "@/components/focus-mode";
import { useTasks } from "@/hooks/use-data";
import { useDailyCheckin, useFlowUsage } from "@/hooks/use-daily-flow";
import { scoreTask, TIME_META, type ScoredTask } from "@/lib/daily-flow";
import { Clock, Flag, Waves, Play, Shuffle, Moon, Sparkles, Lightbulb } from "lucide-react";

/** Hur mycket tid känns rimligt just nu – tre lugna val, inget mer. */
const TIME_CHOICES = [
  { minutes: 10, label: "10 min" },
  { minutes: 25, label: "25 min" },
  { minutes: 60, label: "En timme" },
] as const;

/**
 * "Vad ska jag göra nu?" – ett förslag i taget, aldrig en lista.
 * Flow tittar på din tid, din energi och dina mål – du bestämmer alltid.
 */
export default function WhatNow() {
  const { activeTasks, toggleTask, snoozeTask } = useTasks();
  const { checkin } = useDailyCheckin();
  const { log } = useFlowUsage();

  const defaultMinutes = checkin ? TIME_META[checkin.time].minutes : 25;
  const [minutes, setMinutes] = useState<number>(
    TIME_CHOICES.reduce((best, c) =>
      Math.abs(c.minutes - defaultMinutes) < Math.abs(best.minutes - defaultMinutes) ? c : best,
    ).minutes,
  );
  const [skipped, setSkipped] = useState<string[]>([]);
  const [focusOpen, setFocusOpen] = useState(false);

  const ranked = useMemo<ScoredTask[]>(() => {
    const ctx = {
      energy: checkin?.energy ?? 3,
      load: checkin?.load ?? 3,
      availableMinutes: minutes,
    };
    return activeTasks
      .filter((t) => !skipped.includes(t.id))
      .map((t) => scoreTask(t, ctx))
      .sort((a, b) => b.score - a.score);
  }, [activeTasks, checkin, minutes, skipped]);

  const suggestion = ranked[0] ?? null;

  const handleDone = (item: ScoredTask) => {
    toggleTask(item.task.id);
    setFocusOpen(false);
    log("fokus");
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-lifted pop-in">
          <div className="pointer-events-none absolute -top-16 -right-12 h-36 w-36 rounded-full bg-lavender opacity-70 blur-md" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-blush opacity-60 blur-[2px]" />
          <div className="relative space-y-2">
            <h1 className="font-display text-3xl font-bold text-ink">Vad ska jag göra nu?</h1>
            <p className="text-muted-foreground leading-relaxed">
              Jag tittar på din tid, din energi och dina mål – och föreslår en enda sak. 💜
            </p>
          </div>
        </div>

        {/* Hur lång stund har du? */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Du har ungefär</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIME_CHOICES.map((c) => (
              <button
                key={c.minutes}
                type="button"
                onClick={() => setMinutes(c.minutes)}
                aria-pressed={minutes === c.minutes}
                className={`press rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  minutes === c.minutes
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Förslaget */}
        {suggestion ? (
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-lifted space-y-5 pop-in">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mitt förslag</p>
              <h2 className="mt-2 flex items-start gap-3 font-display text-2xl font-bold text-ink">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-lavender text-primary">
                  <Sparkles size={18} />
                </span>
                <span className="min-w-0 break-words">{suggestion.task.title}</span>
              </h2>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock size={15} className="text-primary" /> Ungefär {suggestion.minutes} min
              </span>
              <span className="flex items-center gap-2">
                <Flag size={15} className="text-primary" /> Prioritet: {suggestion.priority}
              </span>
              <span className="flex items-center gap-2">
                <Waves size={15} className="text-primary" /> Friktion: {suggestion.friction}/10
              </span>
            </div>

            <p className="rounded-2xl bg-secondary/50 p-4 text-sm leading-relaxed text-foreground">
              {suggestion.why}
            </p>

            <div className="space-y-2">
              <Button
                className="press h-12 w-full rounded-2xl text-base"
                onClick={() => { setFocusOpen(true); log("fokus"); }}
              >
                <Play size={18} className="mr-2" /> Börja nu
              </Button>
              <Button
                variant="outline"
                className="press h-12 w-full rounded-2xl"
                onClick={() => setSkipped((prev) => [...prev, suggestion.task.id])}
              >
                <Shuffle size={18} className="mr-2" /> Välj något annat
              </Button>
              <Button
                variant="ghost"
                className="press h-12 w-full rounded-2xl text-muted-foreground"
                onClick={() => snoozeTask(suggestion.task.id, 1)}
              >
                <Moon size={18} className="mr-2" /> Inte idag
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-mint text-primary breathe">
              <Sparkles size={24} />
            </div>
            <p className="font-display text-xl font-bold text-ink">Inget som skriker just nu</p>
            <p className="mt-2 text-muted-foreground">
              {skipped.length > 0
                ? "Vi har gått igenom det som fanns. Det är helt okej att pausa här."
                : "Du har inget öppet att göra. Vila lite – jag håller koll."}
            </p>
            {skipped.length > 0 && (
              <Button variant="outline" className="press mt-4 rounded-2xl" onClick={() => setSkipped([])}>
                Visa förslagen igen
              </Button>
            )}
          </div>
        )}

        {/* Tips – en liten knuff, aldrig ett krav */}
        <div className="rounded-3xl border border-border/60 bg-secondary/40 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Lightbulb size={16} className="text-gold" /> Tips
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Du brukar få mer gjort före lunch. Satsa på det nu 💪
          </p>
        </div>
      </div>


      <FocusMode
        item={suggestion}
        open={focusOpen}
        onOpenChange={setFocusOpen}
        onDone={handleDone}
        onNext={() => suggestion && setSkipped((prev) => [...prev, suggestion.task.id])}
      />
    </Layout>
  );
}
