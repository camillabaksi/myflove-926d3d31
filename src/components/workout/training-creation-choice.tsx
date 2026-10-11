import { Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Presentation only; both actions are owned by the training page. */
export function TrainingCreationChoice({
  onPace,
  onManual,
  disabled = false,
}: {
  onPace: () => void;
  onManual: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="surface-card min-w-0 space-y-4 p-5" aria-label="Skapa träningsprogram">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">Pace skapar ditt träningsprogram</h2>
        <p className="text-sm text-muted-foreground">
          Berätta om ditt mål, din tid och vad kroppen behöver. Pace sätter ihop pass med bilder och
          tydliga instruktioner.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={disabled}
          className="min-h-12 h-auto whitespace-normal rounded-2xl px-4 py-3"
          onClick={onPace}
        >
          <Sparkles size={18} className="shrink-0" aria-hidden /> Skapa med Pace
        </Button>
        <Button
          type="button"
          disabled={disabled}
          variant="outline"
          className="min-h-12 h-auto whitespace-normal rounded-2xl px-4 py-3"
          onClick={onManual}
        >
          <Pencil size={18} className="shrink-0" aria-hidden /> Skapa manuellt
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Du kan alltid ändra passen efteråt.</p>
    </section>
  );
}
