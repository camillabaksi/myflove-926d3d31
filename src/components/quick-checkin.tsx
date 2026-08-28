import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";
import { cn } from "@/lib/utils";

/** Snabbmeny för framtida loggtyper – bara det som redan finns i appen. */
const LOG_LINKS = [
  { href: "/mitt-batteri", emoji: "❤️", label: "Mående" },
  { href: "/energifloede", emoji: "⚡", label: "Energi" },
  { href: "/anteckningar", emoji: "✍️", label: "Anteckning" },
];

interface ScaleSliderProps {
  label: string;
  icon: string;
  startEmoji: string;
  endEmoji: string;
  value: number | null;
  draft: number;
  onDraftChange: (v: number) => void;
  onCommit: (v: number) => void;
  accent: string;
}

/**
 * Mjuk 1–10-slider. Värdet sparas när användaren släpper (change),
 * så att drag inte skapar en registrering per steg.
 */
function ScaleSlider({
  label,
  icon,
  startEmoji,
  endEmoji,
  value,
  draft,
  onDraftChange,
  onCommit,
  accent,
}: ScaleSliderProps) {
  const pct = ((draft - 1) / 9) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          <span aria-hidden>{icon}</span> {label}
        </p>
        <p className="text-sm font-semibold text-ink">
          {value == null ? (
            <span className="text-muted-foreground">{draft}/10</span>
          ) : (
            <>{draft}/10</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span aria-hidden className="text-lg select-none">
          {startEmoji}
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={draft}
          onChange={(e) => onDraftChange(Number(e.target.value))}
          onMouseUp={() => onCommit(draft)}
          onTouchEnd={() => onCommit(draft)}
          onKeyUp={() => onCommit(draft)}
          aria-label={`${label} 1 till 10`}
          aria-valuetext={`${draft} av 10`}
          className="myflove-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full transition-all"
          style={{
            background: `linear-gradient(to right, hsl(var(--${accent})) 0%, hsl(var(--${accent})) ${pct}%, hsl(var(--secondary)) ${pct}%, hsl(var(--secondary)) 100%)`,
          }}
        />
        <span aria-hidden className="text-lg select-none">
          {endEmoji}
        </span>
      </div>
    </div>
  );
}

/**
 * "Hur är det just nu?" – två separata 1–10-värden för mående och energi.
 * Går att justera hur många gånger som helst under dagen.
 */
export default function QuickCheckin({ className }: { className?: string }) {
  const { moodValue, energyValue, logMood, logEnergy } = useQuickCheckin();
  const { explain } = useFlowExplainer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moodDraft, setMoodDraft] = useState(moodValue ?? 5);
  const [energyDraft, setEnergyDraft] = useState(energyValue ?? 5);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (moodValue != null) setMoodDraft(moodValue);
  }, [moodValue]);
  useEffect(() => {
    if (energyValue != null) setEnergyDraft(energyValue);
  }, [energyValue]);

  const logBoth = () => {
    logMood(moodDraft);
    void logEnergy(energyDraft);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <section
      className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-soft", className)}
      aria-label="Hur är det just nu"
    >
      <CollapsibleSection
        id="hem::mående-energi"
        title={
          <span className="flex items-center gap-2">
            <span aria-hidden>❤️</span> Hur är det just nu?
          </span>
        }
        description={explain("energi") ?? undefined}
        headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        className="space-y-5"
        actions={
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Fler ställen att logga på"
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Plus size={13} /> Mer
          </button>
        }
      >
        {menuOpen && (
          <div className="flex flex-wrap gap-2 rounded-2xl bg-secondary/30 p-3">
            {LOG_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-ink shadow-soft transition-colors hover:bg-primary/10"
              >
                <span aria-hidden>{l.emoji}</span> {l.label}
              </Link>
            ))}
          </div>
        )}

        <ScaleSlider
          label="Mående"
          icon="❤️"
          startEmoji="😞"
          endEmoji="😍"
          value={moodValue}
          draft={moodDraft}
          onDraftChange={setMoodDraft}
          onCommit={logMood}
          accent="primary"
        />

        <ScaleSlider
          label="Energi"
          icon="⚡"
          startEmoji="🪫"
          endEmoji="🔋"
          value={energyValue}
          draft={energyDraft}
          onDraftChange={setEnergyDraft}
          onCommit={(v) => void logEnergy(v)}
          accent="accent"
        />

        <button
          type="button"
          onClick={logBoth}
          className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
        >
          {justSaved ? "Sparat ✓" : "Logga"}
        </button>

        <p aria-live="polite" className="text-xs text-muted-foreground">
          {justSaved
            ? "💜 Tack. Det hjälper mig att förstå dig bättre."
            : moodValue != null || energyValue != null
              ? "Du kan justera när du vill under dagen."
              : "Dra till det som stämmer just nu, eller tryck bara Logga. Inget är rätt eller fel."}
        </p>
      </CollapsibleSection>
    </section>
  );
}
