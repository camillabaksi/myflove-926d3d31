import { ArrowDown, ArrowUp, Minus, Plus, RefreshCw, X } from "lucide-react";
import { scoreTone } from "@/lib/flowscore";
import type { FlowDiff } from "@/lib/flow-diff";

function timeAgo(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "nyss";
  if (mins < 60) return `${mins} min sedan`;
  return `${Math.round(mins / 60)} h sedan`;
}

/** Visar skillnaden mellan förra planen och den nyss omräknade. */
export function FlowReplanDiff({ diff, onClose }: { diff: FlowDiff; onClose: () => void }) {
  const up = diff.scoreDelta > 0;
  return (
    <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg text-ink">
            <RefreshCw className="h-5 w-5 text-primary" /> Planen är omräknad
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Jämfört med läget {timeAgo(diff.from.at)}.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng jämförelsen"
          className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3">
        <span className={`font-display text-2xl ${scoreTone(diff.from.score)}`}>
          {diff.from.score}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={`font-display text-2xl ${scoreTone(diff.to.score)}`}>{diff.to.score}</span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            diff.scoreDelta === 0
              ? "bg-muted text-muted-foreground"
              : up
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          {diff.scoreDelta === 0 ? (
            <Minus className="h-3 w-3" />
          ) : up ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {diff.scoreDelta > 0 ? `+${diff.scoreDelta}` : diff.scoreDelta}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{diff.to.label}</span>
      </div>

      {diff.signalChanges.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-ink">Signaler som ändrades</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {diff.signalChanges.map((s) => (
              <li key={s.source}>
                • {s.source}: {s.label} ({s.from ?? 0} → {s.to ?? 0} p,{" "}
                <span
                  className={s.delta > 0 ? "text-primary" : s.delta < 0 ? "text-destructive" : ""}
                >
                  {s.delta > 0 ? `+${s.delta}` : s.delta}
                </span>
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-ink">Vad det gjorde med planen</p>
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {diff.planChanges.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      </div>

      {(diff.added.length > 0 || diff.removed.length > 0) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {diff.added.length > 0 && (
            <div className="rounded-2xl bg-card p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-primary">
                <Plus className="h-3 w-3" /> Nytt i planen
              </p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {diff.added.map((t) => (
                  <li key={t.id}>
                    • {t.title} · {t.minutes} min
                  </li>
                ))}
              </ul>
            </div>
          )}
          {diff.removed.length > 0 && (
            <div className="rounded-2xl bg-card p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Minus className="h-3 w-3" /> Ute ur planen
              </p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {diff.removed.map((t) => (
                  <li key={t.id}>• {t.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(diff.newlyTooHeavy.length > 0 || diff.nowPossible.length > 0) && (
        <div className="mt-3 rounded-2xl bg-gold/10 p-3 text-xs text-ink">
          {diff.nowPossible.length > 0 && (
            <p>💪 Går att ta nu: {diff.nowPossible.map((t) => t.title).join(", ")}</p>
          )}
          {diff.newlyTooHeavy.length > 0 && (
            <p className="mt-1">
              🌙 Sparas till en starkare stund: {diff.newlyTooHeavy.map((t) => t.title).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default FlowReplanDiff;
