import { useState } from "react";
import { ChevronDown, Gauge } from "lucide-react";
import { scoreTone, type FlowScore } from "@/lib/flowscore";
import { FlowScoreBreakdown } from "@/components/flow-score-breakdown";

export function FlowScoreCard({
  flow,
  compact = false,
  minutesLeft,
}: {
  flow: FlowScore;
  compact?: boolean;
  minutesLeft?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-sage/50">
          <span className={`font-display text-xl ${scoreTone(flow.score)}`}>{flow.score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Gauge className="h-5 w-5 text-primary" /> FlowScore – {flow.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{flow.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            🧠 Belastning: {flow.load} · ⏱️ Rimlig fokustid: ca {flow.capacityMinutes} min · 🎯{" "}
            {flow.suggestedTasks} sak{flow.suggestedTasks === 1 ? "" : "er"} att sikta på
          </p>
        </div>
      </div>

      {!compact && flow.factors.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {flow.factors.map((f) => (
            <li
              key={f.label}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                f.delta > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {f.label} {f.delta > 0 ? `+${f.delta}` : f.delta}
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-ink transition hover:bg-muted"
          >
            {open ? "Dölj signalerna" : "Visa exakt vad som påverkade"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-4">
              <FlowScoreBreakdown flow={flow} minutesLeft={minutesLeft ?? flow.capacityMinutes} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FlowScoreCard;

