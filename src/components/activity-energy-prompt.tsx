import { useRef, useState } from "react";
import WhyHint from "@/components/why-hint";
import { cn } from "@/lib/utils";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useTasks } from "@/hooks/use-data";
import type { EnergyImpact } from "@/lib/task-agenda";
import type { FlowItem } from "@/lib/flow-items";
import { useActivityHistory } from "@/hooks/use-activity-history";
import type { ActivityEnergy } from "@/lib/activity-history";
import { todayISO, dayOf } from "@/lib/day";
import { track } from "@/lib/analytics";
import { activityEnergySourceId } from "@/lib/activity-energy-event";
import { announceSavedEnergy } from "@/lib/energy-save-feedback";
import { newEnergyFactorId } from "@/lib/energy-factor-id";

/** Actual impact, including a small effect, stays voluntary and one tap. */
const CHOICES: {
  id: EnergyImpact;
  history: ActivityEnergy | null;
  emoji: string;
  label: string;
  strength: number;
}[] = [
  { id: "gives", history: "gives", emoji: "🟢", label: "Gav lite energi", strength: 1 },
  { id: "gives", history: "gives", emoji: "🟢", label: "Gav energi", strength: 3 },
  { id: "drains", history: "drains_little", emoji: "🔴", label: "Tog lite energi", strength: 1 },
  { id: "drains", history: "drains_much", emoji: "🔴", label: "Tog energi", strength: 4 },
  { id: "both", history: "both", emoji: "🟣", label: "Både och", strength: 1 },
  { id: "neutral", history: "neutral", emoji: "➖", label: "Ingen skillnad", strength: 1 },
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
  anchorTop,
  onClose,
}: {
  item: FlowItem | null;
  anchorTop?: number | null;
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
      writes.current.get(key) ?? { id: newEnergyFactorId(), occurredAt: new Date().toISOString() };
    writes.current.set(key, write);

    try {
      const entry = await addFactor({
        ...write,
        title: item.title,
        direction: choice.id as "gives" | "drains" | "both" | "neutral",
        strength: choice.strength,
        category: "annat",
        kind: "planerat",
        friction: null,
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
      // The history entry belongs to the scheduled occurrence (date), while
      // the energy factor happened when the user actually answered.
      // Battery feedback must use that actual local day, not an old due date.
      announceSavedEnergy(entry, dayOf(entry.occurredAt) ?? todayISO());
      onClose();
    } catch {
      setError("Energipåverkan kunde inte sparas. Försök igen – aktiviteten är fortfarande klar.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  if (!item) return null;
  return (
    <section
      role="region"
      aria-label="Hur kändes det?"
      style={anchorTop != null ? { top: anchorTop } : undefined}
      className={cn("fixed inset-x-2 z-40 mx-auto max-h-[min(70dvh,24rem)] max-w-sm space-y-3 overflow-y-auto rounded-3xl border border-border bg-card p-4 shadow-lg", anchorTop == null ? "top-1/2 -translate-y-1/2" : "")}
    >
      <h2 className="text-base font-semibold">Hur kändes det?</h2>
      <p className="text-sm">{item.title}</p>
      {item.dueDate && item.dueDate !== todayISO() && (
        <p className="text-xs text-muted-foreground">Planerad {item.dueDate} · energin visas för dagen då den registrerades.</p>
      )}
      <WhyHint label="vi frågar om energin" className="self-start">
        Vi frågar hur aktiviteten påverkade dig för att Pace över tid ska kunna förstå vad som ger
        och tar energi för just dig. Svaret är alltid frivilligt.
      </WhyHint>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2 pt-1">
        {CHOICES.map((c) => (
          <button
            key={c.label}
            type="button"
            disabled={busy}
            onClick={() => pick(c)}
            className={cn(
              "press min-h-11 rounded-xl border border-border bg-background px-2 py-2 text-sm font-medium",
              "hover:border-primary hover:text-primary disabled:opacity-60",
            )}
          >
            <span aria-hidden className="mr-1">
              {c.emoji}
            </span>
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
        className="min-h-11 text-sm text-muted-foreground underline underline-offset-4"
      >
        Hoppa över
      </button>
    </section>
  );
}

export default ActivityEnergyPrompt;
