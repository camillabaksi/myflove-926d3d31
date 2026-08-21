import { Link } from "wouter";
import { ListChecks, ArrowRight } from "lucide-react";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { MyFloveTransition } from "@/components/myflove/motion";
import { useFlowItems } from "@/hooks/use-flow-items";
import type { FlowItem } from "@/lib/flow-items";

/**
 * Dagens saker direkt på hemskärmen – allt som användaren faktiskt ska
 * genomföra idag: uppgifter, händelser, barnens hållpunkter, rutiner,
 * lektioner och tankar. Samma kort och samma avbockning som i Min dag och
 * Flow, så status alltid är densamma i hela appen.
 *
 * Färgen på kortet visar livsområde. Bocken visar om det är genomfört –
 * de två blandas aldrig ihop.
 */
export function TodayTasks({ limit = 6 }: { limit?: number }) {
  const { todayOpen, todayDone, toggleItem } = useFlowItems();

  const shown = todayOpen.slice(0, limit);

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
      aria-label="Dagens saker"
    >
      <div className="mb-3 flex items-center gap-2">
        <ListChecks size={18} className="text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Idag
        </h2>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          {todayDone.length > 0
            ? "Allt som hörde till idag är genomfört. Fint jobbat. 💙"
            : "Inget att bocka av just nu. Släpp en tanke i QuickFlow så landar den här."}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => (
            <li key={item.id}>
              <MyFloveTransition transitionKey={String(item.done)}>
                <FlowItemCard
                  item={item}
                  {...(item.completable ? { onToggle: (i: FlowItem) => toggleItem(i) } : {})}
                />
              </MyFloveTransition>
            </li>
          ))}
        </ul>
      )}

      {todayDone.length > 0 && (
        <details className="mt-3 rounded-2xl bg-secondary/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            {todayDone.length} {todayDone.length === 1 ? "sak" : "saker"} genomförda idag 💙
          </summary>
          <ul className="mt-3 space-y-2">
            {todayDone.map((item) => (
              <li key={item.id}>
                <FlowItemCard
                  item={item}
                  className="opacity-80"
                  {...(item.completable ? { onToggle: (i: FlowItem) => toggleItem(i) } : {})}
                />
              </li>
            ))}
          </ul>
        </details>
      )}

      {todayOpen.length > shown.length && (
        <Link
          href="/tasks"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Se alla ({todayOpen.length}) <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}

export default TodayTasks;
