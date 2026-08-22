import { useMemo } from "react";
import Layout from "@/components/layout";
import { MyFloveInsightGather } from "@/components/myflove/motion";
import { CalendarRange } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useQuickflow } from "@/hooks/use-quickflow";
import {
  USAGE_META,
  useFlowUsage,
  useDailyCheckin,
  type FlowUsageKind,
} from "@/hooks/use-daily-flow";
import { estimateFriction } from "@/lib/daily-flow";

const WEEK = 7 * 86_400_000;

/** Veckans Flow – en lugn sammanfattning, aldrig ett betyg. */
export default function WeekFlowPage() {
  const { tasks, snoozedTasks } = useTasks();
  const { items } = useQuickflow();
  const { weekCounts } = useFlowUsage();
  const { history } = useDailyCheckin();

  const cutoff = Date.now() - WEEK;

  const doneCount = useMemo(
    () => tasks.filter((t) => t.completed && (t.completedAt ?? 0) >= cutoff).length,
    [tasks, cutoff],
  );
  const capturedCount = useMemo(
    () => items.filter((i) => i.createdAt >= cutoff).length,
    [items, cutoff],
  );
  const removedCount = useMemo(
    () => items.filter((i) => i.done && (i.doneAt ?? 0) >= cutoff).length,
    [items, cutoff],
  );

  // Enkla observationer – inga slutsatser om dig som person.
  const patterns = useMemo(() => {
    const out: string[] = [];
    const doneWeek = tasks.filter((t) => t.completed && (t.completedAt ?? 0) >= cutoff);
    const morning = doneWeek.filter((t) => new Date(t.completedAt!).getHours() < 12).length;
    if (doneWeek.length >= 4 && morning / doneWeek.length > 0.6) {
      out.push("Du verkar oftare få saker gjorda på förmiddagen.");
    }
    if (doneWeek.length >= 4 && morning / doneWeek.length < 0.25) {
      out.push("Det mesta blir gjort senare på dagen hos dig.");
    }
    const highFriction = snoozedTasks.filter((t) => estimateFriction(t) >= 7).length;
    if (highFriction >= 2) {
      out.push("Du har flera gånger skjutit upp uppgifter med hög friktion.");
    }
    const week = history.filter((h) => new Date(h.date).getTime() >= cutoff);
    if (week.length >= 3) {
      const avg = week.reduce((s, h) => s + h.energy, 0) / week.length;
      out.push(
        avg <= 2.5
          ? "Energin har legat lågt den här veckan. Jag håller planerna små."
          : "Energin har hållit sig ganska jämn den här veckan.",
      );
    }
    return out;
  }, [tasks, snoozedTasks, history, cutoff]);

  const usageRows = (Object.keys(USAGE_META) as FlowUsageKind[]).filter((k) => weekCounts[k] > 0);

  return (
    <Layout>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarRange className="text-primary" size={26} />
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Veckans översikt <MyFloveInsightGather className="shrink-0" />
            </h1>
          </div>
          <p className="text-muted-foreground">
            En lugn tillbakablick på din vecka. Inget mål, inga poäng.
          </p>
        </header>

        <section className="surface-card p-5 space-y-2">
          <h2 className="font-semibold text-ink">Din vecka</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ {doneCount} saker genomförda</li>
            <li>↻ {snoozedTasks.length} omplanerade</li>
            <li>⚡ {capturedCount} saker fångade i QuickFlow</li>
            <li>🗑️ {removedCount} saker som hanterades eller togs bort</li>
          </ul>
        </section>

        <section className="surface-card p-5 space-y-2">
          <h2 className="font-semibold text-ink">Vad hjälpte dig mest?</h2>
          {usageRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ännu för lite data. Jag börjar lära mig hur du fungerar bäst.
            </p>
          ) : (
            <ul className="text-sm text-muted-foreground space-y-1">
              {usageRows.map((k) => (
                <li key={k}>
                  {USAGE_META[k].emoji} {USAGE_META[k].label} användes {weekCounts[k]} gånger
                </li>
              ))}
            </ul>
          )}
        </section>

        {patterns.length > 0 && (
          <section className="surface-card p-5 space-y-2">
            <h2 className="font-semibold text-ink">Jag börjar lära mig hur du fungerar bäst</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              {patterns.map((p) => (
                <li key={p}>· {p}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground/80">
              Det här är observationer från din egen användning – inget annat.
            </p>
          </section>
        )}
      </div>
    </Layout>
  );
}
