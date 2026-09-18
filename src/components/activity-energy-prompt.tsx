import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WhyHint from "@/components/why-hint";
import { cn } from "@/lib/utils";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useTasks } from "@/hooks/use-data";
import type { EnergyImpact } from "@/lib/task-agenda";
import type { FlowItem } from "@/lib/flow-items";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { ActivityEnergy } from "@/lib/activity-history";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";

/** Fyra svar – alltid frivilliga, alltid ett tryck. */
const CHOICES: {
  id: EnergyImpact;
  history: ActivityEnergy | null;
  emoji: string;
  label: string;
  strength: number;
}[] = [
  { id: "gives", history: "gives", emoji: "🟢", label: "Gav energi", strength: 3 },
  { id: "drains", history: "drains_much", emoji: "🔴", label: "Tog energi", strength: 4 },
  { id: "both", history: "drains_little", emoji: "🟣", label: "Både och", strength: 2 },
  { id: "unknown", history: null, emoji: "⚪", label: "Vet inte", strength: 0 },
];

/**
 * Genomförd aktivitet → faktisk energipåverkan.
 *
 * En planerad aktivitet ändrar aldrig energin av sig själv. Först när
 * användaren markerat den som genomförd – och själv svarar här – skapas en
 * energipost. "Vet inte" loggar ingenting alls. Finns redan ett svar för
 * samma förekomst uppdateras det befintliga i stället för att en ny
 * energilogg skapas.
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
  const { setEnergy: setHistoryEnergy, records } = useActivityHistory();
  const [busy, setBusy] = useState(false);

  const pick = async (choice: (typeof CHOICES)[number]) => {
    if (!item || busy) return;
    setBusy(true);

    const date = item.dueDate ?? todayISO();
    const sourceId = item.id.startsWith("task-") ? item.id : `task-${item.id}`;
    // Har förekomsten redan ett energisvar? Då uppdaterar vi det befintliga
    // och skapar ingen ny post i energiflödet.
    const already = records.some(
      (r) => r.sourceId === sourceId && r.date === date && !!r.energyImpact,
    );

    // Uppgifter minns sitt eget svar, så Flow kan jämföra gissning med utfall.
    if (item.id.startsWith("task-")) {
      setTaskActualEnergy(item.id.slice("task-".length), choice.id);
    }

    // Historiken minns svaret på exakt den dag aktiviteten hörde till.
    if (choice.history) {
      setHistoryEnergy(sourceId, date, choice.history);
    }

    // Energiloggen skapas bara när användaren faktiskt sagt något om energin.
    if (choice.id !== "unknown" && !already) {
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

    track("activity_energy_logged", {
      source: "idag",
      result: choice.id === "unknown" ? "cancelled" : "completed",
    });

    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Hur kändes det?</DialogTitle>
        </DialogHeader>
        {item && <p className="-mt-2 text-sm text-muted-foreground">{item.title}</p>}
        <WhyHint label="vi frågar om energin" className="self-start">
          Vi frågar hur aktiviteten påverkade dig för att Flow över tid ska kunna förstå vad som ger
          och tar energi för just dig. Svaret är alltid frivilligt.
        </WhyHint>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => pick(c)}
              className={cn(
                "press min-h-[4.5rem] rounded-2xl border-2 border-border bg-background px-2 py-3 text-sm font-medium",
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
