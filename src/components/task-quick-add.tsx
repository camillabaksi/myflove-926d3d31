import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ENERGY_IMPACTS,
  ENERGY_IMPACT_META,
  FRICTIONS,
  FRICTION_META,
  WHEN_CHOICES,
  resolveWhen,
  todayISO,
  type EnergyImpact,
  type TaskFriction,
  type WhenChoice,
} from "@/lib/task-agenda";

export interface QuickAddResult {
  title: string;
  dueDate?: string;
  time?: string;
  energyImpact?: EnergyImpact;
  friction?: TaskFriction;
}

/**
 * ＋ Lägg till – hela poängen är att det ska gå på några sekunder.
 * Skriv, tryck spara. Allt annat är frivilligt.
 */
export function TaskQuickAdd({
  onAdd,
  className,
}: {
  onAdd: (result: QuickAddResult) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<WhenChoice>("ingen");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [energy, setEnergy] = useState<EnergyImpact | undefined>();
  const [friction, setFriction] = useState<TaskFriction | undefined>();

  const reset = () => {
    setTitle("");
    setWhen("ingen");
    setDate(todayISO());
    setTime("");
    setEnergy(undefined);
    setFriction(undefined);
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const resolved = resolveWhen(when, { date, time });
    onAdd({ title: trimmed, ...resolved, energyImpact: energy, friction });
    setOpen(false);
    reset();
  };

  const chip = (active: boolean) =>
    cn(
      "press rounded-pill border px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-muted-foreground hover:text-foreground",
    );

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("h-14 w-full rounded-2xl text-base shadow-soft", className)}
      >
        <Plus size={22} className="mr-2" /> Lägg till
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vad vill du göra?</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Plugga inför provet"
              className="h-14 rounded-2xl border-transparent bg-secondary/50 text-lg"
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                När?
              </p>
              <div className="flex flex-wrap gap-2">
                {WHEN_CHOICES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setWhen(c.id)}
                    className={chip(when === c.id)}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              {when === "valj" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 rounded-xl bg-background text-sm"
                    aria-label="Datum"
                  />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11 rounded-xl bg-background text-sm"
                    aria-label="Tid"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Energi (valfritt)
              </p>
              <div className="flex flex-wrap gap-2">
                {ENERGY_IMPACTS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEnergy(energy === id ? undefined : id)}
                    className={chip(energy === id)}
                  >
                    {ENERGY_IMPACT_META[id].emoji} {ENERGY_IMPACT_META[id].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Storlek (valfritt)
              </p>
              <div className="flex flex-wrap gap-2">
                {FRICTIONS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFriction(friction === id ? undefined : id)}
                    className={chip(friction === id)}
                  >
                    {FRICTION_META[id].emoji} {FRICTION_META[id].label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={!title.trim()} className="h-12 w-full rounded-2xl">
              Spara
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Du behöver inte fylla i något mer. Det går att ändra när som helst.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TaskQuickAdd;
