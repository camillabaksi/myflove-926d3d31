import { useRef, useState } from "react";
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
import { activityEnergySourceId } from "@/lib/activity-energy-event";

const newFactorId = () =>
  globalThis.crypto?.randomUUID?.() ??
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const n = Math.floor(Math.random() * 16);
    return (ch === "x" ? n : (n & 3) | 8).toString(16);
  });

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
  const { addFactor, entries } = useEnergyFlow();
  const { setTaskActualEnergy } = useTasks();
  const { setEnergy: setHistoryEnergy, records } = useActivityHistory();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef(new Map<string, { id: string; occurredAt: string }>());
  const saving = useRef(false);

  const pick = async (choice: (typeof CHOICES)[number]) => {
    if (!item || saving.current) return;
    if (choice.id === "unknown") {
      track("activity_energy_logged", { source: "idag", result: "cancelled" });
      onClose();
      return;
    }
    saving.current = true;
    setBusy(true);
    setError(null);

    const date = item.dueDate ?? todayISO();
    const sourceId = activityEnergySourceId(item.id);
    const record = records.find((r) => r.sourceId === sourceId && r.date === date);
    const key = `${sourceId}|${date}`;
    // Äldre journalposter saknar faktor-id. Återanvänd bara en entydig
    // energipost som skapades vid just det registrerade svaret.
    const legacy = record?.energyImpactRecordedAt
      ? entries.filter(
          (entry) =>
            entry.title === item.title &&
            entry.kind === "planerat" &&
            Math.abs(new Date(entry.occurredAt).getTime() - record.energyImpactRecordedAt!) <
              60_000,
        )
      : [];
    const previous = record?.energyFactorId
      ? {
          id: record.energyFactorId,
          occurredAt:
            record.energyFactorOccurredAt ??
            new Date(record.energyImpactRecordedAt ?? Date.now()).toISOString(),
        }
      : legacy.length === 1
        ? { id: legacy[0].id, occurredAt: legacy[0].occurredAt }
        : undefined;
    const write = previous ??
      writes.current.get(key) ?? { id: newFactorId(), occurredAt: new Date().toISOString() };
    writes.current.set(key, write);

    try {
      const entry = await addFactor({
        ...write,
        title: item.title,
        direction: choice.id === "gives" ? "gives" : "drains",
        strength: choice.strength,
        category: "annat",
        kind: "planerat",
        friction: choice.id === "both" ? 4 : 2,
        note: "Genomförd aktivitet",
      });
      if (!entry) throw new Error("Energiposten kunde inte sparas.");
      // Markera svaret som sparat först när energiposten har bekräftats.
      // Vid fel ligger rutan kvar och samma id används vid nästa försök.
      if (item.id.startsWith("task-")) {
        setTaskActualEnergy(item.id.slice("task-".length), choice.id);
      }
      if (choice.history)
        setHistoryEnergy(sourceId, date, choice.history, {
          id: entry.id,
          occurredAt: entry.occurredAt,
        });
      track("activity_energy_logged", { source: "idag", result: "completed" });
      onClose();
    } catch {
      setError("Energipåverkan kunde inte sparas. Försök igen – aktiviteten är fortfarande klar.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && !saving.current && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Hur kändes det?</DialogTitle>
        </DialogHeader>
        {item && <p className="-mt-2 text-sm text-muted-foreground">{item.title}</p>}
        <WhyHint label="vi frågar om energin" className="self-start">
          Vi frågar hur aktiviteten påverkade dig för att Pace över tid ska kunna förstå vad som ger
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
        {busy && (
          <p role="status" className="text-center text-sm text-muted-foreground">
            Sparar energipåverkan…
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy}
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
