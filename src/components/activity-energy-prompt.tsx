import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WhyHint from "@/components/why-hint";
import { cn } from "@/lib/utils";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useTasks } from "@/hooks/use-data";
import type { EnergyImpact } from "@/lib/task-agenda";
import type { FlowItem } from "@/lib/flow-items";

/** Fyra svar – alltid frivilliga, alltid ett klick. */
const CHOICES: { id: EnergyImpact; emoji: string; label: string; strength: number }[] = [
  { id: "gives", emoji: "❤️", label: "Gav energi", strength: 3 },
  { id: "drains", emoji: "🔻", label: "Tog lite energi", strength: 2 },
  { id: "both", emoji: "⚡", label: "Tog mycket energi", strength: 5 },
  { id: "unknown", emoji: "🤷", label: "Vet inte", strength: 0 },
];

/**
 * Genomförd aktivitet → faktisk energipåverkan.
 *
 * En planerad aktivitet ändrar aldrig energin av sig själv. Först när
 * användaren markerat den som genomförd – och själv svarar här – skapas en
 * energipost. "Vet inte" loggar ingenting alls.
 */
export function ActivityEnergyPrompt({
  item,
  onClose,
}: {
  item: FlowItem | null;
  onClose: () => void;
}) {
  const { addFactor } = useEnergyFlow();
  const { setTaskActualEnergy } = useTasks();
  const [busy, setBusy] = useState(false);

  const pick = async (choice: (typeof CHOICES)[number]) => {
    if (!item || busy) return;
    setBusy(true);

    // Uppgifter minns sitt eget svar, så Flow kan jämföra gissning med utfall.
    if (item.id.startsWith("task-")) {
      setTaskActualEnergy(item.id.slice("task-".length), choice.id);
    }

    // Energiloggen skapas bara när användaren faktiskt sagt något om energin.
    if (choice.id !== "unknown") {
      try {
        await addFactor({
          title: item.title,
          direction: choice.id === "gives" ? "gives" : "drains",
          strength: choice.strength,
          category: "annat",
          kind: "planerat",
          friction: choice.id === "both" ? 4 : 2,
          note: "Genomförd aktivitet",
        });
      } catch {
        // Energiloggen är en bonus – aktiviteten är redan avbockad.
      }
    }

    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Klart! Hur påverkade det din energi?</DialogTitle>
        </DialogHeader>
        {item && <p className="-mt-2 text-sm text-muted-foreground">{item.title}</p>}
        <WhyHint label="vi frågar om energin" className="self-start">
          Vi frågar hur aktiviteten påverkade dig för att Flow över tid ska kunna förstå vad som ger
          och tar energi för just dig. Svaret är alltid frivilligt.
        </WhyHint>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 pt-1">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => pick(c)}
              className={cn(
                "press rounded-2xl border-2 border-border bg-background px-3 py-4 text-sm font-medium",
                "hover:border-primary hover:text-primary disabled:opacity-60",
              )}
            >
              <span className="block text-xl">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto text-xs text-muted-foreground underline underline-offset-4"
        >
          Hoppa över
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default ActivityEnergyPrompt;
