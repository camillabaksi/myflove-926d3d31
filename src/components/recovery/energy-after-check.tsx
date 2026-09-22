import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { track } from "@/lib/analytics";

/**
 * Frivillig snabb energikoll efter en återhämtning (Paus, Ljusboost …).
 * Ett tryck – sparas i befintlig energilogg (energy_factors) via useEnergyFlow.
 * Ingen ny datamodell och ingen ny historik.
 */
export default function EnergyAfterCheck({
  title,
  source,
  onDone,
}: {
  /** Vad användaren just gjort, t.ex. "Paus 20 min". */
  title: string;
  /** Kort källnamn för anonym statistik, t.ex. "paus". */
  source: string;
  onDone: () => void;
}) {
  const { addFactor } = useEnergyFlow();
  const [saving, setSaving] = useState(false);

  const choose = async (direction: "gives" | "neutral" | "drains") => {
    if (saving) return;
    setSaving(true);
    track("recovery_energy_checkin", { source, method: direction });
    try {
      await addFactor({
        title,
        direction,
        strength: direction === "neutral" ? 1 : 2,
        category: "aterhamtning",
        kind: "aterhamtning",
      });
    } finally {
      onDone();
    }
  };

  return (
    <div
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
      aria-label="Hur känns energin nu?"
    >
      <p className="text-sm font-semibold text-ink">Hur känns energin nu?</p>
      <p className="mt-1 text-xs text-muted-foreground">Ett tryck – eller hoppa över.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 rounded-2xl"
          disabled={saving}
          onClick={() => void choose("gives")}
        >
          🟢 Mer energi
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 rounded-2xl"
          disabled={saving}
          onClick={() => void choose("neutral")}
        >
          🟣 Samma
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 rounded-2xl"
          disabled={saving}
          onClick={() => void choose("drains")}
        >
          🔴 Mindre
        </Button>
      </div>
      <button
        type="button"
        onClick={onDone}
        className="mt-3 text-xs text-muted-foreground underline underline-offset-2"
      >
        Hoppa över
      </button>
    </div>
  );
}
