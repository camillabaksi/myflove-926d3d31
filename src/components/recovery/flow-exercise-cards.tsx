import { useState } from "react";
import { Save, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExercisePlayer from "@/components/recovery/exercise-player";
import { useSavedExercises } from "@/hooks/use-saved-exercises";
import { useChildren } from "@/hooks/use-children";
import { track } from "@/lib/analytics";
import {
  CATEGORY_META,
  draftToSaved,
  durationLabel,
  ownerLine,
  type ExerciseCategory,
  type ExerciseDraft,
} from "@/lib/saved-exercises";
import { cn } from "@/lib/utils";

const choice =
  "min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink transition-colors hover:bg-secondary";

/** Övning som Flow har skapat – kan startas direkt och (frivilligt) sparas. */
export function FlowExerciseDraftCard({ draft }: { draft: ExerciseDraft }) {
  const { save } = useSavedExercises();
  const { children } = useChildren();
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState<"idle" | "where" | "who" | "saved">("idle");
  const [savedLabel, setSavedLabel] = useState("");

  const commit = (category: ExerciseCategory, childId?: string) => {
    save(draftToSaved(draft, category, childId));
    track("recovery_viewed", { source: "flow_save" });
    const who = childId === "all" ? "alla barn" : children.find((c) => c.id === childId)?.name;
    setSavedLabel(`Sparad i ${CATEGORY_META[category].label}${who ? ` · ${who}` : ""}.`);
    setStep("saved");
  };

  if (playing) {
    return <div className="ml-10 max-w-[calc(100%-2.5rem)]"><ExercisePlayer exercise={draft} onClose={() => setPlaying(false)} /></div>;
  }

  return (
    <div className="ml-10 max-w-[calc(100%-2.5rem)] space-y-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft" data-testid="flow-exercise-draft">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{draft.icon}</span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{draft.title}</p>
          <p className="text-xs text-muted-foreground">
            {[durationLabel(draft.minutes), draft.age, draft.situation].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setPlaying(true)}>
        <Play className="h-4 w-4" /> Starta övningen
      </Button>

      {step === "idle" && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-sm text-ink">Vill du spara den här övningen?</p>
          <Button size="sm" className="rounded-full" onClick={() => setStep("where")}>
            <Save className="h-4 w-4" /> Spara i Återhämtningsbiblioteket
          </Button>
        </div>
      )}
      {step === "where" && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-sm font-medium text-ink">Var vill du spara den?</p>
          <div className="flex flex-wrap gap-2">
            {(["mig", "barn", "favorit"] as ExerciseCategory[]).map((c) => (
              <button key={c} type="button" className={cn(choice, draft.forChild && c === "barn" && "border-primary")}
                onClick={() => (c === "barn" ? setStep("who") : commit(c))}>
                <span aria-hidden>{CATEGORY_META[c].emoji}</span> {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setStep("idle")}>Inte nu</button>
        </div>
      )}
      {step === "who" && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-sm font-medium text-ink">Vem vill du spara den för?</p>
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <button key={c.id} type="button" className={choice} onClick={() => commit("barn", c.id)}>
                <span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
            <button type="button" className={choice} onClick={() => commit("barn", "all")}>Alla barn</button>
          </div>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setStep("where")}>Tillbaka</button>
        </div>
      )}
      {step === "saved" && (
        <p className="flex items-center gap-1.5 border-t border-border/60 pt-3 text-sm font-medium text-primary">
          <Check className="h-4 w-4" /> {savedLabel}
        </p>
      )}
    </div>
  );
}

/** Flow föreslår en övning som redan finns sparad. */
export function FlowSavedSuggestionCard({ id, onAsk }: { id: string; onAsk: (text: string) => void }) {
  const { exercises } = useSavedExercises();
  const { children } = useChildren();
  const [playing, setPlaying] = useState(false);
  const [answered, setAnswered] = useState(false);
  const ex = exercises.find((e) => e.id === id);
  if (!ex) return null;
  const childName = children.find((c) => c.id === ex.childId)?.name;

  if (playing) {
    return <div className="ml-10 max-w-[calc(100%-2.5rem)]"><ExercisePlayer exercise={{ ...ex, subtitle: ownerLine(ex, childName) }} onClose={() => setPlaying(false)} /></div>;
  }
  return (
    <div className="ml-10 max-w-[calc(100%-2.5rem)] space-y-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft" data-testid="flow-saved-suggestion">
      <p className="text-xs text-muted-foreground">Ni har sparat den här tidigare. Vill du prova den igen?</p>
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{ex.icon}</span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{ex.title}</p>
          <p className="text-xs text-muted-foreground">{[durationLabel(ex.minutes), ownerLine(ex, childName)].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {!answered && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={() => setPlaying(true)}><Play className="h-4 w-4" /> Starta övningen</Button>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { setAnswered(true); onAsk("Visa andra alternativ"); }}>Visa andra alternativ</Button>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setAnswered(true); onAsk("Skapa en ny övning istället"); }}>Skapa något nytt</Button>
        </div>
      )}
    </div>
  );
}
