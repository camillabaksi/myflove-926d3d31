import { useMemo, useState } from "react";
import { Mic, Plus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import HelpHint from "@/components/help-hint";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { track } from "@/lib/analytics";
import {
  DID_SUGGESTIONS,
  FRICTION_LEVELS,
  type DidSuggestion,
  type EnergyDirection,
  type EnergyFactorEntry,
} from "@/lib/energy-flow";

const DIRECTIONS: { id: EnergyDirection; emoji: string; label: string }[] = [
  { id: "drains", emoji: "🔻", label: "Tar energi" },
  { id: "gives", emoji: "🔺", label: "Ger energi" },
  { id: "neutral", emoji: "➖", label: "Neutral" },
];

type WhenChoice = "nu" | "formiddag" | "eftermiddag" | "igar";

const WHEN: { id: WhenChoice; label: string }[] = [
  { id: "nu", label: "Nyss" },
  { id: "formiddag", label: "I förmiddags" },
  { id: "eftermiddag", label: "I eftermiddags" },
  { id: "igar", label: "Igår" },
];

function occurredAtFor(choice: WhenChoice): string {
  const d = new Date();
  if (choice === "formiddag") d.setHours(10, 0, 0, 0);
  if (choice === "eftermiddag") d.setHours(15, 0, 0, 0);
  if (choice === "igar") {
    d.setDate(d.getDate() - 1);
    d.setHours(19, 0, 0, 0);
  }
  return d.toISOString();
}

/**
 * "Lägg till det du gjorde" – lågfriktionsregistrering av allt som faktiskt
 * hände under dagen men aldrig hamnade i kalendern. Ett tryck räcker; energi
 * och friktion går alltid att ändra efteråt.
 */
export function DidThisQuickAdd({ className }: { className?: string }) {
  const { presets, addFactor, updateFactor, removeFactor, signedIn } = useEnergyFlow();
  const { toast } = useToast();

  const [when, setWhen] = useState<WhenChoice>("nu");
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<EnergyDirection>("drains");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<EnergyFactorEntry | null>(null);

  const { isListening, isSupported, toggleListening } = useVoiceInput((transcript) =>
    setText(transcript),
  );

  /** Egna snabbknappar först, sedan vanliga vardagsförslag som inte krockar. */
  const chips = useMemo<DidSuggestion[]>(() => {
    const own: DidSuggestion[] = presets.map((p) => ({
      title: p.title,
      emoji: p.direction === "gives" ? "🔺" : p.direction === "neutral" ? "➖" : "🔻",
      direction: p.direction,
      strength: p.strength,
      category: p.category,
      kind: p.kind,
      friction: p.friction ?? 2,
    }));
    const taken = new Set(own.map((o) => o.title.toLowerCase()));
    return [...own, ...DID_SUGGESTIONS.filter((s) => !taken.has(s.title.toLowerCase()))];
  }, [presets]);

  const add = async (s: DidSuggestion) => {
    if (busy) return;
    setBusy(true);
    try {
      const entry = await addFactor({
        title: s.title,
        direction: s.direction,
        strength: s.strength,
        category: s.category,
        kind: s.kind,
        friction: s.friction,
        occurredAt: occurredAtFor(when),
      });
      setLast(entry ?? null);
      toast({ description: `${s.title} – tillagt. Det räknas med i din dag.` });
    } catch {
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const addCustom = async () => {
    const title = text.trim();
    if (!title) return;
    await add({
      title,
      emoji: "✨",
      direction,
      strength: direction === "neutral" ? 1 : 3,
      category: "annat",
      kind: when === "nu" ? "spontant" : "vardag",
      friction: 2,
    });
    setText("");
  };

  if (!signedIn) return null;

  return (
    <section
      className={cn(
        "rounded-3xl border-2 border-border/60 bg-card p-5 shadow-soft space-y-3",
        className,
      )}
      aria-label="Lägg till det du gjorde"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Lägg till det du gjorde
        </h2>
        <HelpHint label="lägg till det du gjorde">
          Små vardagssaker syns inte i kalendern men tar ändå energi. Tryck på en ruta så räknas den
          med i dagens energiflöde – det blir aldrig en uppgift eller kalenderhändelse.
        </HelpHint>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WHEN.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWhen(w.id)}
            className={cn(
              "press rounded-full border px-3 py-1 text-xs transition-colors",
              when === w.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((s) => (
          <button
            key={`${s.title}-${s.direction}`}
            type="button"
            disabled={busy}
            onClick={() => add(s)}
            className="press rounded-2xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-ink transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
          >
            <span aria-hidden className="mr-1">
              {s.emoji}
            </span>
            {s.title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDirection(d.id)}
            aria-pressed={direction === d.id}
            className={cn(
              "press rounded-full border px-3 py-1 text-xs transition-colors",
              direction === d.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void addCustom();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Något annat du gjorde…"
          className="h-11 rounded-2xl"
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label="Säg vad du gjorde"
            className={cn(
              "press grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border/60",
              isListening ? "bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            <Mic size={18} />
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label="Lägg till"
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </form>

      {last && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/40 px-3 py-2 text-xs">
          <span className="font-medium text-ink">{last.title}</span>
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                void updateFactor(last.id, { direction: d.id });
                setLast({ ...last, direction: d.id });
              }}
              className={cn(
                "press rounded-full border px-2 py-0.5",
                last.direction === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {d.emoji}
            </button>
          ))}
          {FRICTION_LEVELS.map((f) => (
            <button
              key={f.value}
              type="button"
              title={f.label}
              onClick={() => {
                void updateFactor(last.id, { friction: f.value });
                setLast({ ...last, friction: f.value });
              }}
              className={cn(
                "press rounded-full border px-2 py-0.5",
                last.friction === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {f.emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              void removeFactor(last.id);
              setLast(null);
            }}
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Undo2 size={13} /> Ångra
          </button>
        </div>
      )}
    </section>
  );
}

export default DidThisQuickAdd;
