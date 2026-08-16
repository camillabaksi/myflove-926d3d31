import { useMemo, useState } from "react";
import { Moon } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFlowReset, useFlowUsage, type DayFeel } from "@/hooks/use-daily-flow";
import { todayISO } from "@/lib/daily-flow";

const FEELS: { id: DayFeel; emoji: string; label: string }[] = [
  { id: "bra", emoji: "😊", label: "Bra" },
  { id: "sadar", emoji: "😐", label: "Sådär" },
  { id: "kaos", emoji: "😵", label: "Kaos" },
];

const isToday = (ts?: number) =>
  !!ts && new Date(ts).toDateString() === new Date().toDateString();

/**
 * Flow Reset – kvällsläge. Helt frivilligt.
 * Ofärdiga saker är aldrig ett misslyckande, bara något som får flytta med.
 */
export default function FlowReset() {
  const { tasks, activeTasks, snoozedTasks, setTaskDueDate } = useTasks();
  const { items } = useQuickflow();
  const { todayEntry, save } = useFlowReset();
  const { log } = useFlowUsage();
  const [replanned, setReplanned] = useState(false);

  const today = todayISO();

  const doneToday = useMemo(
    () => tasks.filter((t) => t.completed && isToday(t.completedAt)).length,
    [tasks],
  );
  const movedToday = snoozedTasks.length;
  const capturedToday = useMemo(
    () => items.filter((i) => isToday(i.createdAt)).length,
    [items],
  );
  const unfinishedToday = useMemo(
    () => activeTasks.filter((t) => t.dueDate && t.dueDate <= today),
    [activeTasks, today],
  );

  const replan = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    // Behåll de två mest angelägna idag – resten får flytta med till imorgon.
    unfinishedToday.slice(2).forEach((t) => setTaskDueDate(t.id, iso));
    log("omplanering");
    setReplanned(true);
    toast.success("Klart. Imorgon börjar lugnare. 💙");
  };

  return (
    <div className="surface-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Moon size={18} className="text-primary" />
        <h3 className="text-lg font-semibold text-ink">Flow Reset 🌙</h3>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Hur blev dagen?</p>
        <div className="flex flex-wrap gap-2">
          {FEELS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                save(f.id);
                toast("Tack för att du berättade. 💙");
              }}
              aria-pressed={todayEntry?.feel === f.id}
              className={`rounded-2xl border px-5 py-3 text-base font-medium transition-colors ${
                todayEntry?.feel === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">Det här hann du med idag</p>
        <ul className="text-sm text-muted-foreground space-y-0.5">
          <li>✓ {doneToday} {doneToday === 1 ? "uppgift klar" : "uppgifter klara"}</li>
          <li>✓ {movedToday} {movedToday === 1 ? "sak flyttad" : "saker flyttade"}</li>
          <li>✓ {capturedToday} {capturedToday === 1 ? "sak fångad" : "saker fångade"} i QuickFlow</li>
        </ul>
      </div>

      {unfinishedToday.length > 2 && !replanned && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm text-ink">
            Det blev inte som planerat. Det är okej. Vill du att jag hjälper dig planera om?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={replan}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Ja, planera om
            </button>
            <button
              type="button"
              onClick={() => setReplanned(true)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium"
            >
              Jag gör det själv
            </button>
            <button
              type="button"
              onClick={() => setReplanned(true)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground"
            >
              Inte nu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
