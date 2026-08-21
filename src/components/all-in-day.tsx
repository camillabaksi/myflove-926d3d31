import { useMemo } from "react";
import { FlowItemCard } from "@/components/myflove/flow-item-card";
import { MyFloveTransition } from "@/components/myflove/motion";
import { useFlowItems } from "@/hooks/use-flow-items";
import type { FlowItem } from "@/lib/flow-items";

/**
 * ✨ Allt i dagen – ett andra perspektiv på samma dag.
 *
 * Vanliga kalendern svarar på "När händer mina tidsbundna saker?".
 * Den här vyn svarar på "Vad består min dag faktiskt av?" – allt som ska
 * göras eller redan är gjort idag, hämtat från exakt samma data (useFlowItems)
 * som Idag, Lista, Hem och Att göra. Inga dubbletter, ingen egen status:
 * avbockning här är samma avbockning som överallt annars.
 */
export default function AllInDay() {
  const { today, toggleItem } = useFlowItems();

  const { timed, untimed, doneCount } = useMemo(() => {
    const timed: FlowItem[] = [];
    const untimed: FlowItem[] = [];
    for (const item of today) (item.time ? timed : untimed).push(item);
    timed.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    return { timed, untimed, doneCount: today.filter((i) => i.done).length };
  }, [today]);

  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Hela dagen – både tidsbundet och sånt som bara ska bli gjort. Samma status som i Idag, Hem
          och Att göra.
        </p>
        {doneCount > 0 && (
          <span className="rounded-pill bg-secondary/60 px-3 py-1 text-xs font-medium text-ink">
            ✨ {doneCount} {doneCount === 1 ? "aktivitet" : "aktiviteter"} genomförda idag
          </span>
        )}
      </div>

      {today.length === 0 && (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          Inget i dagen ännu. Släpp en tanke i QuickFlow så landar den här.
        </p>
      )}

      {timed.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            🕒 Under klockslag
          </h4>
          <ul className="space-y-2">
            {timed.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="mt-4 w-12 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {item.time}
                </span>
                <div className="min-w-0 flex-1">
                  <MyFloveTransition transitionKey={String(item.done)}>
                    <FlowItemCard
                      item={item}
                      className={item.done ? "opacity-80" : undefined}
                      {...(item.completable ? { onToggle: toggleItem } : {})}
                    />
                  </MyFloveTransition>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {untimed.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            🌿 Under dagen
          </h4>
          <ul className="space-y-2">
            {untimed.map((item) => (
              <li key={item.id}>
                <MyFloveTransition transitionKey={String(item.done)}>
                  <FlowItemCard
                    item={item}
                    className={item.done ? "opacity-80" : undefined}
                    {...(item.completable ? { onToggle: toggleItem } : {})}
                  />
                </MyFloveTransition>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
