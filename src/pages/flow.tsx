import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import CollapsibleSection from "@/components/collapsible-section";
import { AssistantContent } from "@/pages/assistant";
import TodayTasks from "@/components/today-tasks";
import { useTasks } from "@/hooks/use-data";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import FlowDeck from "@/components/flow/flow-deck";
import { FlowGreeting } from "@/components/flow/flow-intro";
import { assessToday, suggestMove } from "@/lib/flow-engine";
import { planFlowSequence } from "@/lib/flowplan.functions";
import { useDayPlan, type DayPlanStep } from "@/lib/day-plan";
import { MyFloveThinking, MyFloveTransition } from "@/components/myflove/motion";
import { Sparkles, Sun, MessageCircle, CalendarClock, Check, ListOrdered } from "lucide-react";

type Layer = "nu" | "idag" | "hjalp";

const LAYERS: Array<{ id: Layer; label: string; icon: typeof Sparkles }> = [
  { id: "nu", label: "Just nu", icon: Sparkles },
  { id: "idag", label: "Planera min dag", icon: Sun },
  { id: "hjalp", label: "Fråga MyFlove", icon: MessageCircle },
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
            <Sparkles className="h-7 w-7 text-primary" /> Planera
          </h1>
          <p className="mt-1 text-muted-foreground">Vad är bäst just nu, och vad hinner du idag?</p>
        </header>

        <div
          role="tablist"
          aria-label="Välj vy"
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
  return (
    <FlowGreeting>
      <FlowDeck />
    </FlowGreeting>
  );
}


/* ── IDAG ───────────────────────────────────────────────────────── */

function TodayLayer() {
  const { activeTasks, snoozeTask } = useTasks();
  const { reading, items } = useEnergyBattery();
  const [handled, setHandled] = useState(false);

  const load = useMemo(() => assessToday(reading, items), [reading, items]);
  const move = useMemo(() => suggestMove(load, reading, activeTasks), [load, reading, activeTasks]);

  return (
    <div className="space-y-5">
      <section className="surface-card space-y-4 p-6">
        <CollapsibleSection
          id="flow::dagens-belastning"
          title={
            <span className="flex items-center gap-2">
              <CalendarClock size={18} className="text-primary" aria-hidden="true" /> Dagens
              belastning
            </span>
          }
          headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          className="space-y-4"
        >
          <p className="text-base leading-relaxed text-foreground">{load.summary}</p>

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
        </CollapsibleSection>
      </section>

      {/* 📋 Planera min dag – en smart ordning på dagens saker */}
      <PlanMyDay />

      {/* Samma kort och samma avbockning som Hem, Min dag och Att göra. */}
      <TodayTasks limit={8} />
    </div>
  );
}

/* ── PLANERA MIN DAG ────────────────────────────────────────────── */

/**
 * Föreslår en ordning på dagens uppgifter (tidigare FlowPlan).
 * Skapar inga nya aktiviteter – bara en ordning på dem som redan finns.
 */
function PlanMyDay() {
  const { activeTasks } = useTasks();
  const { reading } = useEnergyBattery();
  const { plan, save, clear } = useDayPlan();
  const makePlan = useServerFn(planFlowSequence);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DayPlanStep[] | null>(null);
  const [intro, setIntro] = useState("");
  const [note, setNote] = useState("");

  const energy: "low" | "medium" | "high" =
    reading.now >= 66 ? "high" : reading.now >= 33 ? "medium" : "low";

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await makePlan({
        data: {
          energy,
          tasks: activeTasks.slice(0, 20).map((t) => ({
            id: t.id,
            title: t.title,
            ...(t.dueDate ? { dueDate: t.dueDate } : {}),
          })),
        },
      });
      const steps: DayPlanStep[] = [...result.plan]
        .sort((a, b) => a.order - b.order)
        .map((p) => ({
          taskId: p.taskId,
          title: activeTasks.find((t) => t.id === p.taskId)?.title ?? "Uppgift",
          estimatedMin: p.estimatedMin,
          why: p.why,
        }));
      setDraft(steps);
      setIntro(result.intro);
      setNote(result.note);
    } catch {
      setError("Kunde inte föreslå en ordning just nu. Försök gärna igen om en stund.");
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });
  };

  const list = draft ?? plan?.steps ?? null;
  const isDraft = draft !== null;

  return (
    <section className="surface-card space-y-4 p-6">
      <CollapsibleSection
        id="flow::planera-min-dag"
        title={
          <span className="flex items-center gap-2">
            <ListOrdered size={18} className="text-primary" aria-hidden="true" /> Planera min dag
          </span>
        }
        headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          Hjälp mig hitta en smart ordning för dagens saker – utifrån tider, ork och svårighetsgrad.
        </p>

        {activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inget att planera just nu. Lägg till något först så föreslår jag en ordning. 💙
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-2xl" onClick={() => void generate()} disabled={busy}>
                {busy ? "Tänker…" : list ? "Föreslå en ny ordning" : "Föreslå en ordning"}
              </Button>
              {plan && !isDraft && (
                <Button variant="outline" className="rounded-2xl" onClick={clear}>
                  Ta bort planen
                </Button>
              )}
            </div>

            {busy && <MyFloveThinking />}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {(isDraft ? intro : plan?.intro) && (
              <p className="text-base leading-relaxed text-foreground">
                {isDraft ? intro : plan?.intro}
              </p>
            )}

            {list && list.length > 0 && (
              <ol className="space-y-2">
                {list.map((step, i) => (
                  <li
                    key={`${step.taskId}-${i}`}
                    className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.estimatedMin ? `ca ${step.estimatedMin} min · ` : ""}
                        {step.why}
                      </p>
                    </div>
                    {isDraft && (
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label="Flytta upp"
                          onClick={() => move(i, -1)}
                          className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Flytta ner"
                          onClick={() => move(i, 1)}
                          className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
                        >
                          ↓
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {(isDraft ? note : plan?.note) && (
              <p className="text-sm text-muted-foreground">{isDraft ? note : plan?.note}</p>
            )}

            {isDraft && list && list.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    save({ intro, note, steps: list });
                    setDraft(null);
                  }}
                >
                  <Check size={16} className="mr-1.5" /> Använd planen
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => setDraft(null)}>
                  Avbryt
                </Button>
              </div>
            )}

            {!isDraft && plan && (
              <p className="text-xs text-muted-foreground">Planen visas också i Min dag.</p>
            )}
          </>
        )}
      </CollapsibleSection>
    </section>
  );
}
