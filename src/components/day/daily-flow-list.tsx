import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { kindFromId } from "@/components/flow-item-actions";
import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import { FlowItemActions } from "@/components/flow-item-actions";
import { MyFloveTransition } from "@/components/myflove/motion";
import { useFlowItems } from "@/hooks/use-flow-items";
import { SOURCE_LABEL, type FlowItem } from "@/lib/flow-items";
import { cn } from "@/lib/utils";

function itemKey(item: FlowItem) {
  return `${item.title.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim()}|${item.time ?? ""}`;
}

function sortAsDay(items: FlowItem[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.time && b.item.time) return a.item.time.localeCompare(b.item.time);
      if (a.item.time) return -1;
      if (b.item.time) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export function DailyFlowList({
  date,
  extraItems = [],
  onCompleted,
}: {
  date?: string;
  extraItems?: FlowItem[];
  onCompleted?: (item: FlowItem) => void;
}) {
  const { today, toggleItem } = useFlowItems(date);
  /**
   * "Hur kändes det?" hör ihop med själva avbockningen och bor därför här –
   * samma lista används i både Min dag och Kalendern, så frågan ställs exakt
   * en gång per avbockning oavsett var den sker.
   */
  const [energyItem, setEnergyItem] = useState<FlowItem | null>(null);
  /** Anpassa en aktivitet som redan finns – inget nytt skapas. */
  const [adaptItem, setAdaptItem] = useState<FlowItem | null>(null);
  const items = useMemo(() => {
    const merged = new Map<string, FlowItem>();
    for (const item of [...today, ...extraItems]) {
      const key = itemKey(item);
      const previous = merged.get(key);
      if (!previous || (item.done && !previous.done)) merged.set(key, item);
    }
    return sortAsDay([...merged.values()]);
  }, [today, extraItems]);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
        Inget inplanerat den här dagen.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border/50" aria-label="Dagens innehåll">
        {items.map((item) => (
          <li key={item.id}>
            <MyFloveTransition transitionKey={String(item.done)}>
              <div
                className={cn("flex min-w-0 items-center gap-2 py-3", item.done && "opacity-60")}
              >
                <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {item.time ?? ""}
                </span>
                {item.completable ? (
                  <button
                    type="button"
                    onClick={() => {
                      const wasDone = item.done;
                      toggleItem(item);
                      if (!wasDone) {
                        setEnergyItem(item);
                        onCompleted?.(item);
                      }
                    }}
                    aria-label={item.done ? `Ångra ${item.title}` : `Klarmarkera ${item.title}`}
                    className="press shrink-0 rounded-full p-1 text-muted-foreground hover:text-primary"
                  >
                    {item.done ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                  </button>
                ) : (
                  <span className="w-7 shrink-0 text-center text-sm" aria-hidden>
                    {item.emoji}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "break-words text-sm font-medium text-ink",
                      item.done && "line-through",
                    )}
                  >
                    {item.source === "rutin" && <span aria-hidden>↻ </span>}
                    {item.title}
                  </p>
                  <span className="mt-0.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {SOURCE_LABEL[item.source]}
                  </span>
                </div>
                <FlowItemActions
                  itemId={item.id}
                  size={14}
                  className="flex shrink-0 items-center"
                />
                {item.href && (
                  <Link
                    href={item.href}
                    aria-label={`Öppna ${item.title}`}
                    className="press shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-primary"
                  >
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </MyFloveTransition>
          </li>
        ))}
      </ul>
      <ActivityEnergyPrompt item={energyItem} onClose={() => setEnergyItem(null)} />
      <Dialog open={!!adaptItem} onOpenChange={(o) => !o && setAdaptItem(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Anpassa efter idag</DialogTitle>
          </DialogHeader>
          {adaptItem && (
            <AdaptiveActivityCard
              text={adaptItem.title}
              source="min-dag"
              existingTaskId={
                kindFromId(adaptItem.id).kind === "uppgift"
                  ? kindFromId(adaptItem.id).realId
                  : undefined
              }
              readOnly={kindFromId(adaptItem.id).kind !== "uppgift"}
              onDone={() => setAdaptItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DailyFlowList;
