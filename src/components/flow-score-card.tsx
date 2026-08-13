import { Gauge } from "lucide-react";
import { scoreTone, type FlowScore } from "@/lib/flowscore";

export function FlowScoreCard({ flow, compact = false }: { flow: FlowScore; compact?: boolean }) {
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
                f.delta >= 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {f.label} {f.delta >= 0 ? `+${f.delta}` : f.delta}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FlowScoreCard;
