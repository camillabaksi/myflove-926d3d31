import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Plus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import HelpHint from "@/components/help-hint";
import { useToast } from "@/hooks/use-toast";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { track } from "@/lib/analytics";
import { getDataOwner } from "@/lib/account-scope";
import { ACCOUNT_BOUND_EVENT } from "@/lib/cloud-storage";
import { announceSavedEnergy, ENERGY_FEEDBACK_CLEAR_EVENT } from "@/lib/energy-save-feedback";
import { newEnergyFactorId } from "@/lib/energy-factor-id";
import {
  DID_SUGGESTIONS,
  type DidSuggestion,
  type EnergyDirection,
  type EnergyFactorEntry,
} from "@/lib/energy-flow";

const DIRECTIONS: { id: EnergyDirection; label: string; strength?: number }[] = [
  { id: "gives", label: "Gav lite energi", strength: 1 },
  { id: "gives", label: "Gav energi" },
  { id: "drains", label: "Tog lite energi", strength: 1 },
  { id: "drains", label: "Tog energi" },
  { id: "both", label: "Både och" },
  { id: "neutral", label: "Ingen skillnad" },
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
  // An observation of something already done must not land in the future.
  return new Date(Math.min(d.getTime(), Date.now())).toISOString();
}

/** Select what happened, then answer with one tap. Suggestions never decide
 * how an activity felt. No calendar event, obligation or autosaved draft. */
export function DidThisQuickAdd({ className }: { className?: string }) {
  const { presets, addFactor, removeFactor, signedIn } = useEnergyFlow();
  const { toast } = useToast();
  const [when, setWhen] = useState<WhenChoice>("nu");
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<DidSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<EnergyFactorEntry | null>(null);
  const saving = useRef(false);
  const owner = useRef(getDataOwner());
  const write = useRef<{ id: string; occurredAt: string } | null>(null);
  const { isListening, isSupported, toggleListening } = useVoiceInput(setText);
  useEffect(() => {
    const clear = () => {
      if (owner.current === getDataOwner()) return;
      owner.current = getDataOwner();
      setSelected(null);
      setText("");
      setLast(null);
      setError(null);
      write.current = null;
    };
    window.addEventListener(ACCOUNT_BOUND_EVENT, clear);
    return () => window.removeEventListener(ACCOUNT_BOUND_EVENT, clear);
  }, []);
  const chips = useMemo<DidSuggestion[]>(() => {
    const own = presets.map((p) => ({ ...p, emoji: "✨", friction: p.friction ?? 2 }));
    const taken = new Set(own.map((o) => o.title.toLowerCase()));
    return [...own, ...DID_SUGGESTIONS.filter((s) => !taken.has(s.title.toLowerCase()))];
  }, [presets]);
  const choose = (s: DidSuggestion) => {
    if (saving.current) return;
    setSelected(s);
    setError(null);
    setMore(false);
    write.current = { id: newEnergyFactorId(), occurredAt: occurredAtFor(when) };
  };
  const add = async (direction: EnergyDirection, strength?: number) => {
    if (!selected || saving.current) return;
    const uid = getDataOwner();
    if (uid !== owner.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      const entry = await addFactor({
        ...write.current!,
        title: selected.title,
        direction,
        strength: strength ?? (direction === "both" || direction === "neutral" ? 1 : 3),
        category: selected.category,
        kind: selected.kind,
        friction: null,
      });
      if (uid !== getDataOwner()) return;
      if (!entry) throw new Error("Energiposten kunde inte sparas.");
      track("did_this_logged", { source: "lagg-till" });
      setLast(entry);
      setSelected(null);
      setText("");
      write.current = null;
      announceSavedEnergy(entry);
    } catch {
      if (uid === getDataOwner()) setError("Kunde inte spara. Ditt val finns kvar – försök igen.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
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
        <h2 className="text-sm font-semibold text-foreground">Lägg till det du gjorde</h2>
        <HelpHint label="lägg till det du gjorde">
          Välj vad du gjorde och hur det kändes. Det blir ingen uppgift eller kalenderhändelse. Du
          bestämmer vad som ger och tar energi.
        </HelpHint>
      </div>
      {selected ? (
        <div className="space-y-3">
          <p className="font-medium">{selected.title} · Hur kändes det?</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                disabled={busy}
                onClick={() => void add(d.id, d.strength)}
                className="press min-h-11 rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-60"
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            className="min-h-11 text-sm underline"
            onClick={() => {
              setSelected(null);
              write.current = null;
            }}
          >
            Vet inte / hoppa över
          </button>
          {busy && <p role="status">Sparar…</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {chips.map((s) => (
              <button
                key={`${s.title}-${s.direction}`}
                type="button"
                disabled={busy}
                onClick={() => choose(s)}
                className="press min-h-11 rounded-2xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm disabled:opacity-60"
              >
                <span aria-hidden className="mr-1">
                  {s.emoji}
                </span>
                {s.title}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim())
                choose({
                  title: text.trim(),
                  emoji: "✨",
                  direction: "neutral",
                  strength: 3,
                  category: "annat",
                  kind: "spontant",
                  friction: 2,
                });
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
                  isListening && "text-primary",
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
          <button
            type="button"
            onClick={() => setMore(!more)}
            aria-expanded={more}
            className="min-h-11 text-sm underline"
          >
            {more ? "Visa mindre" : "Annan tid"}
          </button>
          {more && (
            <div className="flex flex-wrap gap-2">
              {WHEN.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWhen(w.id)}
                  aria-pressed={when === w.id}
                  className={cn(
                    "press min-h-11 rounded-xl border px-3 py-2 text-sm",
                    when === w.id && "border-primary text-primary",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {last && !selected && (
        <div className="flex flex-wrap items-center gap-2 text-sm" role="status">
          <span>
            ✓ {last.title} · {DIRECTIONS.find((d) => d.id === last.direction)?.label}
          </span>
          <button
            type="button"
            disabled={busy}
            className="min-h-11 inline-flex items-center gap-1 underline"
            onClick={async () => {
              if (saving.current) return;
              saving.current = true;
              setBusy(true);
              try {
                await removeFactor(last.id);
                window.dispatchEvent(new Event(ENERGY_FEEDBACK_CLEAR_EVENT));
                setLast(null);
              } catch {
                toast({ description: "Kunde inte ångra. Försök igen.", variant: "destructive" });
              } finally {
                saving.current = false;
                setBusy(false);
              }
            }}
          >
            <Undo2 size={14} />
            Ångra
          </button>
        </div>
      )}
    </section>
  );
}
export default DidThisQuickAdd;
