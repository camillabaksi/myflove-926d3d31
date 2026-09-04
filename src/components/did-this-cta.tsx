import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Check, Plus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MyFloveModal } from "@/components/myflove/modal";
import { useToast } from "@/hooks/use-toast";
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
  { id: "drains", emoji: "🔻", label: "Tog energi" },
  { id: "gives", emoji: "🔺", label: "Gav energi" },
  { id: "neutral", emoji: "➖", label: "Neutralt" },
];

/**
 * "➕ Jag gjorde något" – ständig snabbknapp på Hem.
 * Flöde: välj/skriv → tryck energi (sparas direkt) → friktion är frivilligt.
 */
export function DidThisCta({
  className,
  trigger,
}: {
  className?: string;
  trigger?: ReactElement<{ onClick?: () => void; className?: string; children?: React.ReactNode }>;
}) {
  const { presets, addFactor, updateFactor, removeFactor, signedIn } = useEnergyFlow();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<DidSuggestion | null>(null);
  const [saved, setSaved] = useState<EnergyFactorEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

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
    return [...own, ...DID_SUGGESTIONS.filter((s) => !taken.has(s.title.toLowerCase()))].slice(
      0,
      10,
    );
  }, [presets]);

  const reset = () => {
    setText("");
    setPicked(null);
    setSaved(null);
  };

  const openModal = () => {
    reset();
    setOpen(true);
  };

  const choose = (s: DidSuggestion) => setPicked(s);

  const chooseCustom = () => {
    const title = text.trim();
    if (!title) return;
    setPicked({
      title,
      emoji: "✨",
      direction: "drains",
      strength: 3,
      category: "annat",
      kind: "spontant",
      friction: 2,
    });
  };

  const save = async (direction: EnergyDirection) => {
    if (!picked || busy) return;
    setBusy(true);
    try {
      const entry = await addFactor({
        title: picked.title,
        direction,
        strength: direction === "neutral" ? 1 : picked.strength,
        category: picked.category,
        kind: picked.kind,
        friction: picked.friction ?? null,
        occurredAt: new Date().toISOString(),
      });
      setSaved(entry ?? null);
      closeTimer.current = setTimeout(() => setOpen(false), 2600);
    } catch {
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) return null;

  return (
    <>
      {trigger ? (
        <button
          type="button"
          onClick={() => {
            trigger.props.onClick?.();
            openModal();
          }}
          aria-label="Lägg till det du gjorde"
          className={trigger.props.className}
        >
          {trigger.props.children}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          aria-label="Lägg till det du gjorde"
          className={cn(
            "press group flex w-full items-center gap-3 rounded-3xl border-2 border-primary/25 bg-primary/5 p-4 text-left shadow-soft transition-colors hover:border-primary/50 hover:bg-primary/10",
            className,
          )}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:scale-105 group-active:scale-95 breathe">
            <Plus size={20} />
          </span>
          <span className="min-w-0">
            <span className="block font-display font-semibold text-ink">Jag gjorde något</span>
            <span className="block text-sm text-muted-foreground">
              Registrera något du redan gjort
            </span>
          </span>
        </button>
      )}

      <MyFloveModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
        emoji="➕"
        title={saved ? "Sparat" : picked ? "Hur kändes det?" : "Vad gjorde du?"}
        description={
          saved
            ? "Det räknas nu med i dagens energiflöde."
            : picked
              ? "Ett tryck så är det klart."
              : "Välj en ruta eller skriv själv."
        }
        className="max-w-md"
      >
        {!picked && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((s) => (
                <button
                  key={`${s.title}-${s.direction}`}
                  type="button"
                  onClick={() => choose(s)}
                  className="press rounded-2xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-ink transition-colors hover:border-primary/50 hover:bg-primary/5"
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
                chooseCustom();
              }}
            >
              <Input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Något annat du gjorde…"
                className="h-12 rounded-2xl text-base"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Fortsätt"
                className="press grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        )}

        {picked && !saved && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">
              <span aria-hidden className="mr-1">
                {picked.emoji}
              </span>
              {picked.title}
            </p>
            <div className="grid gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void save(d.id)}
                  className="press flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left text-base text-ink transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
                >
                  <span aria-hidden className="text-xl">
                    {d.emoji}
                  </span>
                  {d.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Byt aktivitet
            </button>
          </div>
        )}

        {saved && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-ink">
              <Check size={16} className="text-primary" /> {saved.title}
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Frivilligt: hur svårt var det att komma igång?
              </p>
              <div className="flex flex-wrap gap-2">
                {FRICTION_LEVELS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      if (closeTimer.current) clearTimeout(closeTimer.current);
                      void updateFactor(saved.id, { friction: f.value });
                      setSaved({ ...saved, friction: f.value });
                    }}
                    className={cn(
                      "press rounded-full border px-3 py-1.5 text-sm transition-colors",
                      saved.friction === f.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  void removeFactor(saved.id);
                  reset();
                }}
                className="press inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Undo2 size={13} /> Ångra
              </button>
              <button
                type="button"
                onClick={() => {
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  reset();
                }}
                className="press rounded-full bg-secondary/60 px-3 py-1.5 text-xs font-medium text-ink"
              >
                Lägg till en till
              </button>
            </div>
          </div>
        )}
      </MyFloveModal>
    </>
  );
}

export default DidThisCta;
