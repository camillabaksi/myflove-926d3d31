import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import type { Task } from "@/hooks/use-data";
import {
  ENERGY_IMPACTS,
  ENERGY_IMPACT_META,
  FRICTION_META,
  type EnergyImpact,
} from "@/lib/task-agenda";

/**
 * "Klart! Hur påverkade det din energi?" – alltid frivilligt, alltid ett klick.
 * Svaret sparas på uppgiften och (när riktningen är tydlig) i Energiflöde™
 * så att Flow senare kan jämföra förväntad energi med faktisk.
 */
export function TaskEnergyPrompt({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, impact: EnergyImpact) => void;
}) {
  const { addFactor } = useEnergyFlow();
  const [busy, setBusy] = useState(false);

  const pick = async (impact: EnergyImpact) => {
    if (!task || busy) return;
    setBusy(true);
    onSave(task.id, impact);
    if (impact === "drains" || impact === "gives") {
      try {
        await addFactor({
          title: task.title,
          direction: impact,
          strength: task.friction ? Math.round(FRICTION_META[task.friction].minutes / 12) || 2 : 3,
          category: "annat",
          kind: "planerat",
          friction: task.friction ? 3 : 2,
          note: "Loggad från Att göra",
        });
      } catch {
        // Energiloggen är en bonus – uppgiften är redan klarmarkerad.
      }
    }
    setBusy(false);
    onClose();
  };

  const expected = task?.energyImpact;

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Klart! Hur påverkade det din energi?</DialogTitle>
        </DialogHeader>
        {task && <p className="-mt-2 text-sm text-muted-foreground">{task.title}</p>}
        {expected && (
          <p className="text-xs text-muted-foreground">
            Du gissade {ENERGY_IMPACT_META[expected].emoji}{" "}
            {ENERGY_IMPACT_META[expected].label.toLowerCase()} innan.
          </p>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 pt-1">
          {ENERGY_IMPACTS.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => pick(id)}
              className={cn(
                "press rounded-2xl border border-border bg-background px-3 py-4 text-sm font-medium",
                "hover:border-primary hover:text-primary disabled:opacity-60",
              )}
            >
              <span className="block text-xl">{ENERGY_IMPACT_META[id].emoji}</span>
              {ENERGY_IMPACT_META[id].doneLabel}
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

export default TaskEnergyPrompt;
