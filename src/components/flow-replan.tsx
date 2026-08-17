import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyFloveButton } from "@/components/myflove";
import HelpHint from "@/components/help-hint";
import type { FlowScore } from "@/lib/flowscore";
import type { FlowItem } from "@/lib/flow-items";
import {
  REPLAN_OPTIONS,
  replanEffect,
  replanOption,
  replanReason,
  suggestedMode,
  type ReplanMode,
} from "@/lib/replan";

/**
 * "Ska vi lägga om dagen?" – dyker upp när FlowScore är lågt och erbjuder
 * en enklare plan i stället för en tillsägelse.
 */
export function FlowReplan({
  flow,
  items,
  mode,
  chosen,
  onChange,
  keepCount,
  restCount,
}: {
  flow: FlowScore;
  items: FlowItem[];
  mode: ReplanMode;
  chosen: boolean;
  onChange: (mode: ReplanMode) => void;
  keepCount: number;
  restCount: number;
}) {
  const suggested = suggestedMode(flow.score);

  return (
    <section className="rounded-3xl border border-border/60 bg-lavender/60 p-5 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink">
        <RefreshCw size={18} className="text-primary" /> Ska vi lägga om dagen?
        <HelpHint label="omplanering">
          MyFlove föreslår en mindre dag när kapaciteten är låg. Inget tas bort – det du
          inte gör idag flyttas till "Resten kan vänta".
        </HelpHint>
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">{replanReason(flow, items)}</p>

      <div className="mt-4 space-y-2">
        {REPLAN_OPTIONS.map((opt) => {
          const active = mode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => onChange(opt.mode)}
              aria-pressed={active}
              className={cn(
                "press w-full rounded-2xl border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-card shadow-soft"
                  : "border-border/60 bg-card/60 hover:bg-card",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span aria-hidden>{opt.emoji}</span>
                {opt.label}
                {!chosen && opt.mode === suggested && (
                  <span className="rounded-pill bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Mitt förslag
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{opt.blurb}</span>
            </button>
          );
        })}
      </div>

      {chosen ? (
        <p className="mt-3 text-sm text-ink">
          {replanOption(mode).emoji} {replanEffect(mode, keepCount, restCount)} Du kan byta
          läge när som helst idag.
        </p>
      ) : (
        <MyFloveButton
          className="mt-3"
          size="sm"
          onClick={() => onChange(suggested)}
          icon={RefreshCw}
        >
          Gör som du föreslår
        </MyFloveButton>
      )}
    </section>
  );
}

export default FlowReplan;
