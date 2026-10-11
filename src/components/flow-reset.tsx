import { useMemo, useState } from "react";
import { Moon } from "lucide-react";
import { MyFloveNightSky } from "@/components/myflove/motion";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useFlowReset, useFlowUsage, type DayFeel } from "@/hooks/use-daily-flow";
import { todayISO } from "@/lib/daily-flow";
import { useDayDone } from "@/hooks/use-day-done";

const FEELS: { id: DayFeel; emoji: string; label: string }[] = [
  { id: "bra", emoji: "😊", label: "Bra" },
  { id: "sadar", emoji: "😐", label: "Sådär" },
  { id: "kaos", emoji: "😵", label: "Kaos" },
];

const isToday = (ts?: number) => !!ts && new Date(ts).toDateString() === new Date().toDateString();

/**
 * Flow Reset – kvällsläge. Helt frivilligt.
 * Ofärdiga saker är aldrig ett misslyckande, bara något som får flytta med.
 */
export default function FlowReset() {
  const { tasks, activeTasks, snoozedTasks, setTaskDueDate } = useTasks();
  const { items } = useQuickflow();
  const { todayEntry, save } = useFlowReset();
  const { lines: dayDone } = useDayDone();
  const { log } = useFlowUsage();
  const [replanned, setReplanned] = useState(false);

  const today = todayISO();

  const doneToday = useMemo(
    () => tasks.filter((t) => t.completed && isToday(t.completedAt)).length,
    [tasks],
  );
  const movedToday = snoozedTasks.length;
  const capturedToday = useMemo(() => items.filter((i) => isToday(i.createdAt)).length, [items]);
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
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-border/60 p-5 shadow-soft space-y-5 pop-in"
      style={{
        backgroundImage:
          "linear-gradient(135deg, hsl(var(--lavender)) 0%, hsl(var(--cream)) 60%, hsl(var(--sky) / 0.8) 100%)",
      }}
    >
      <MyFloveNightSky />

      <div className="relative flex items-center gap-2">
        <Moon size={18} className="text-primary" />
        <h3 className="font-display text-lg font-bold text-ink">Kvällsavslut 🌙</h3>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Hur blev dagen?</p>
        <div className="grid grid-cols-3 gap-3">
          {FEELS.map((f) => {
            const active = todayEntry?.feel === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  save(f.id);
                  toast("Tack för att du berättade. 💙");
                }}
                aria-pressed={active}
                className={`press flex flex-col items-center gap-2 rounded-3xl border-2 px-2 py-4 transition-colors ${
                  active
                    ? "border-primary bg-card shadow-soft"
                    : "border-transparent bg-card/70 hover:bg-card"
                }`}
              >
                <span aria-hidden className="text-3xl leading-none">
                  {f.emoji}
                </span>
                <span className={`text-sm font-semibold ${active ? "text-primary" : "text-ink"}`}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl bg-card/80 p-4 space-y-1.5">
        <p className="text-sm font-semibold text-ink">Det här hann du med idag</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            ✅ {doneToday} {doneToday === 1 ? "uppgift klar" : "uppgifter klara"}
          </li>
          <li>
            📦 {movedToday} {movedToday === 1 ? "sak flyttad" : "saker flyttade"}
          </li>
          <li>
            💭 {capturedToday} {capturedToday === 1 ? "sak fångad" : "saker fångade"} i Fånga
          </li>
          {dayDone.map((d) => (
            <li key={d.text}>
              {d.emoji} {d.text}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          Rutiner, medicin och rörelse räknas också. Det är inte bara uppgifter som är en dag.
        </p>
      </div>

      {todayEntry && (
        <div className="rounded-3xl bg-card/80 p-4">
          <p className="text-sm text-ink">
            {todayEntry.feel === "kaos"
              ? "Jag tar med mig det här till imorgon och börjar dagen lugnare."
              : todayEntry.feel === "bra"
                ? "Jag tar med mig det här till imorgon och ger dig lite mer utrymme."
                : "Jag tar med mig det här till imorgon och börjar neutralt."}
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Dagens balans på förmiddagen utgår från hur idag kändes.
          </p>
        </div>
      )}

      {unfinishedToday.length > 2 && !replanned && (
        <div className="rounded-3xl bg-card/80 p-4 space-y-3">
          <p className="text-sm text-ink">
            Det blev inte som planerat. Det är okej. Vill du att jag hjälper dig planera om?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={replan}
              className="press rounded-pill bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
            >
              Ja, planera om
            </button>
            <button
              type="button"
              onClick={() => setReplanned(true)}
              className="press rounded-pill bg-lavender px-4 py-2.5 text-sm font-semibold text-ink"
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
