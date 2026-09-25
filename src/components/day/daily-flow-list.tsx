import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Circle, Link2 } from "lucide-react";
import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import { FlowItemActions, kindFromId } from "@/components/flow-item-actions";
import { MyFloveTransition } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import { SOURCE_LABEL, todayISO, type FlowItem } from "@/lib/flow-items";
import { areaChipStyle, areaColor } from "@/lib/life-areas";
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
  /** Anpassa en aktivitet som redan finns – inget nytt skapas. */
  const [adaptItem, setAdaptItem] = useState<FlowItem | null>(null);
  /** Egen ordning per dag – sparas som nycklar så den överlever omladdning. */
  const dayISO = date ?? todayISO();
  const [orderMap, setOrderMap] = useCloudSyncedStorage<Record<string, string[]>>(
    "myflove-day-order",
    {},
  );
  const items = useMemo(() => {
    const merged = new Map<string, FlowItem>();
    for (const item of [...today, ...extraItems]) {
      const key = itemKey(item);
      const previous = merged.get(key);
      if (!previous || (item.done && !previous.done)) merged.set(key, item);
    }
    const sorted = sortAsDay([...merged.values()]);
    const saved = orderMap[dayISO];
    if (!saved || saved.length === 0) return sorted;
    const byKey = new Map(sorted.map((item) => [itemKey(item), item]));
    const out: FlowItem[] = [];
    for (const key of saved) {
      const found = byKey.get(key);
      if (found) {
        out.push(found);
        byKey.delete(key);
      }
    }
    for (const item of sorted) if (byKey.has(itemKey(item))) out.push(item);
    return out;
  }, [today, extraItems, orderMap, dayISO]);

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return;
      const keys = items.map(itemKey);
      const [moved] = keys.splice(index, 1);
      keys.splice(target, 0, moved);
      setOrderMap((prev) => ({ ...prev, [dayISO]: keys }));
    },
    [items, dayISO, setOrderMap],
  );

  /** Var i dagen är vi just nu? Uppdateras varje minut, bara för dagens datum. */
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(id);
  }, []);
  const isToday = dayISO === todayISO();
  const nowIndex = useMemo(() => {
    if (!isToday) return -1;
    const idx = items.findIndex((item) => {
      if (!item.time) return false;
      const [h, m] = item.time.split(":").map(Number);
      if (Number.isNaN(h)) return false;
      return h * 60 + (m || 0) > nowMinutes;
    });
    return idx;
  }, [items, isToday, nowMinutes]);

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
        {items.map((item, index) => {
          const visual = dailyActivityVisual(item);
          const visualColor = visual.colorArea ? areaColor(visual.colorArea) : undefined;
          const visualChip = visual.colorArea ? areaChipStyle(visual.colorArea) : undefined;
          return (
            <li key={item.id}>
              <MyFloveTransition transitionKey={String(item.done)}>
                <div
                  className={cn(
                    "relative my-2 overflow-hidden rounded-2xl border border-border/60 bg-card px-2.5 py-3 shadow-sm sm:px-3",
                    item.done && "bg-muted/35 opacity-70",
                  )}
                  style={visualColor ? { borderLeft: `4px solid ${visualColor}` } : undefined}
                >
                  <div className="grid min-w-0 grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[3rem_3rem_minmax(0,1fr)_auto] sm:gap-3">
                    <span className="text-center text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
                      {item.time ?? ""}
                    </span>
                    <ActivityPictogram
                      id={visual.pictogram}
                      tone={visual.tone}
                      className="h-11 w-11 rounded-xl sm:h-12 sm:w-12"
                      iconClassName="h-6 w-6 sm:h-7 sm:w-7"
                      style={visualColor ? { color: visualColor } : undefined}
                    />
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-1">
                        {item.completable && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const wasDone = item.done;
                              toggleItem(item);
                              if (!wasDone) onCompleted?.(item);
                            }}
                            aria-label={item.done ? `Ångra ${item.title}` : `Klarmarkera ${item.title}`}
                            className="-ml-1 h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                          >
                            {item.done ? <CheckCircle2 className="text-primary" /> : <Circle />}
                          </Button>
                        )}
                        <p className={cn("min-w-0 flex-1 break-words pt-1 text-sm font-semibold leading-snug text-ink sm:text-[15px]", item.done && "line-through")}>
                          {item.title}
                        </p>
                      </div>
                      <div className={cn("mt-1 flex min-w-0 flex-wrap items-center gap-1.5", item.completable && "sm:pl-7")}>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={visualChip}>
                          {visual.label}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {SOURCE_LABEL[item.source]}
                        </span>
                        {item.linkedLabel && (
                          <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-medium text-muted-foreground">
                            <Link2 size={11} aria-hidden />
                            <span className="sr-only">Kopplad familjeaktivitet:</span>
                            <span className="truncate">{item.linkedLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <FlowItemActions
                      itemId={item.id}
                      size={14}
                      compact
                      className="h-9 w-9 text-muted-foreground"
                    >
                      <DropdownMenuItem onSelect={() => move(index, -1)} disabled={index === 0}>
                        <ArrowUp /> Flytta upp
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => move(index, 1)} disabled={index === items.length - 1}>
                        <ArrowDown /> Flytta ner
                      </DropdownMenuItem>
                      {item.href && (
                        <DropdownMenuItem asChild>
                          <Link href={item.href}>
                            <ArrowRight /> Öppna aktivitet
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </FlowItemActions>
                  </div>
                </div>
              </MyFloveTransition>
            </li>
          );
        })}
      </ul>
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
