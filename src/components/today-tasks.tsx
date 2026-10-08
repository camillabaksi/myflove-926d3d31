import { Link } from "wouter";
import { ListChecks, ArrowRight } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { MyFloveTransition } from "@/components/myflove/motion";
import { useFlowItems } from "@/hooks/use-flow-items";
import type { FlowItem } from "@/lib/flow-items";

/**
 * Dagens saker direkt på hemskärmen – allt som användaren faktiskt ska
 * genomföra idag: uppgifter, händelser, barnens hållpunkter, rutiner,
 * lektioner och tankar. Samma kort och samma avbockning som i Idag och
 * Flow, så status alltid är densamma i hela appen.
 *
 * Färgen på kortet visar livsområde. Bocken visar om det är genomfört –
 * de två blandas aldrig ihop.
 */
export function TodayTasks({
  limit = 6,
  compact = false,
}: {
  limit?: number;
  /** Kompakt läge (Hem): bara det som är kvar idag + väg till Min dag. */
  compact?: boolean;
}) {
  const { todayOpen, todayDone, toggleItem } = useFlowItems();

  const shown = todayOpen.slice(0, limit);

  return (
    <section
      className="rounded-3xl border-2 border-border/60 bg-card p-5 shadow-soft"
      aria-label="Dagens saker"
    >
      <CollapsibleSection
        id="dagens-saker::idag"
        title={
          <span className="flex items-center gap-2">
            <ListChecks size={18} className="text-primary" aria-hidden="true" /> Idag
          </span>
        }
        headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        className="space-y-3"
      >
        {shown.length === 0 ? (
          <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
            {todayDone.length > 0
              ? "Allt som hörde till idag är genomfört. Fint jobbat. 💙"
              : "Inget att bocka av just nu. Släpp en tanke i Fånga så landar den här."}
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

        {!compact && todayDone.length > 0 && (
          <div className="mt-3 rounded-2xl bg-secondary/30 p-3">
            <CollapsibleSection
              id="dagens-saker::genomfort-idag"
              title={`☑️ ${todayDone.length} ${todayDone.length === 1 ? "sak" : "saker"} genomförda idag 💙`}
              headingClassName="text-sm font-medium text-ink"
              defaultCollapsed
            >
              <ul className="space-y-2">
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
            </CollapsibleSection>
          </div>
        )}

        {compact && todayDone.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            ☑️ {todayDone.length} {todayDone.length === 1 ? "sak" : "saker"} genomförda idag 💙
          </p>
        )}

        {compact ? (
          <Link
            href="/idag"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {todayOpen.length > shown.length
              ? `Se hela dagen (${todayOpen.length}) i Idag`
              : "Se hela dagen i Idag"}{" "}
            <ArrowRight size={14} />
          </Link>
        ) : (
          todayOpen.length > shown.length && (
            <Link
              href="/tasks"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Se alla ({todayOpen.length}) <ArrowRight size={14} />
            </Link>
          )
        )}
      </CollapsibleSection>
    </section>
  );
}

export default TodayTasks;
