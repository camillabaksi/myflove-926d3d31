import { useMemo } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Sparkles } from "lucide-react";
import { explainFlowScore, scoreTone, type FlowScore } from "@/lib/flowscore";

/**
 * Visar exakt vilka signaler som räknades in i FlowScore just nu,
 * hur mycket varje signal flyttade scoren och vad den ändrade i planen.
 */
export function FlowScoreBreakdown({
  flow,
  minutesLeft,
}: {
  flow: FlowScore;
  minutesLeft: number;
}) {
  const { impacts, runningTotal } = useMemo(
    () => explainFlowScore(flow, minutesLeft),
    [flow, minutesLeft],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Så räknades det ihop
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
          {runningTotal.map((step, i) => (
            <span key={step.label + i} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="rounded-full bg-card px-2.5 py-1 text-xs text-ink shadow-sm">
                {step.label} <span className={scoreTone(step.score)}>{step.score}</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {impacts.map((f) => (
          <li key={f.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{f.label}</p>
                <p className="text-xs text-muted-foreground">
                  {f.source} · {f.reading}
                </p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  f.delta > 0
                    ? "bg-primary/10 text-primary"
                    : f.delta < 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {f.delta > 0 ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : f.delta < 0 ? (
                  <ArrowDown className="h-3.5 w-3.5" />
                ) : null}
                {f.delta > 0 ? `+${f.delta}` : f.delta}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{f.why}</p>

            <div className="mt-3 rounded-xl bg-background/70 p-3">
              <p className="text-xs font-medium text-ink">Vad den ändrade i planen</p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {f.changes.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
              {f.delta !== 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Utan den här signalen: score {f.scoreWithout} ({f.planWithout.label})
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-ink">
        <p className="flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> Så används balansen i Jobb och Studier
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            • Fokustid: {flow.capacityMinutes} min av {minutesLeft} min kvar av dagen.
          </li>
          <li>
            • Gräns för svårighetsgrad {flow.maxFriction}/10 – tyngre uppgifter läggs under "för tungt nu".
          </li>
          <li>
            • Planen fylls med max {flow.suggestedTasks} sak{flow.suggestedTasks === 1 ? "" : "er"},
            resten hamnar i "senare idag".
          </li>
          <li>
            • Energin påverkar även rankningen: låg energi väger upp svårighetsgrad hårdare i listan för just nu.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FlowScoreBreakdown;
