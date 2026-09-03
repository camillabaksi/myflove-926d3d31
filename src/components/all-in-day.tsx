import { useMemo } from "react";
import CollapsibleSection from "@/components/collapsible-section";
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
/** "9:00", "09:00" och "9.00" blir samma minutvärde – annars sorteras text. */
function minutesOf(time?: string): number {
  const m = time?.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return Number.POSITIVE_INFINITY;
  return Number(m[1]) * 60 + Number(m[2]);
}

export default function AllInDay({ date, isToday = true }: { date?: string; isToday?: boolean }) {
  const { today, toggleItem } = useFlowItems(date);

  const { timed, untimed, doneCount } = useMemo(() => {
    const timed: FlowItem[] = [];
    const untimed: FlowItem[] = [];
    for (const item of today) (item.time ? timed : untimed).push(item);
    timed.sort(
      (a, b) => minutesOf(a.time) - minutesOf(b.time) || a.title.localeCompare(b.title, "sv"),
    );
    untimed.sort((a, b) => Number(!!a.done) - Number(!!b.done));
    return { timed, untimed, doneCount: today.filter((i) => i.done).length };
  }, [today]);

  return (
    <div className="space-y-4 rounded-3xl border-2 border-border/60 bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isToday
            ? "Det du gjort först, tiderna efteråt. Samma aktiviteter och status som i Min dag."
            : "Det du gjorde och tiderna för den här dagen – från samma aktivitetsdata."}
        </p>
        {doneCount > 0 && (
          <span className="rounded-pill bg-secondary/60 px-3 py-1 text-xs font-medium text-ink">
            {doneCount} {doneCount === 1 ? "sak" : "saker"} gjorda{" "}
            {isToday ? "idag" : "den här dagen"}
          </span>
        )}
      </div>

      {today.length === 0 && (
        <p className="rounded-2xl bg-secondary/30 p-4 text-sm text-muted-foreground">
          {isToday
            ? "Inget i dagen ännu. Släpp en tanke i QuickFlow så landar den här."
            : "Inget inlagt den här dagen ännu."}
        </p>
      )}

      {untimed.length > 0 && (
        <CollapsibleSection
          id="allt-i-dagen::det-har-gjorde"
          title="✓ Det här gjorde du"
          headingClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          className="space-y-2"
        >
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
        </CollapsibleSection>
      )}

      {timed.length > 0 && (
        <CollapsibleSection
          id="allt-i-dagen::tider"
          title="🕒 Tider"
          headingClassName="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          className="space-y-2"
        >
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
        </CollapsibleSection>
      )}
    </div>
  );
}
