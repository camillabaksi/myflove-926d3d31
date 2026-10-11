import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown } from "lucide-react";
import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { DailyActivityRow } from "./daily-activity-row";
import { FlowItemActions, kindFromId } from "@/components/flow-item-actions";
import { MyFloveTransition } from "@/components/myflove/motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO, type FlowItem } from "@/lib/flow-items";
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
  previewCount,
  dayHeadings = false,
  presentation = "card",
  showPictograms = false,
}: {
  date?: string;
  extraItems?: FlowItem[];
  onCompleted?: (item: FlowItem) => void;
  /** Visa bara de första punkterna och låt resten fällas ut. */
  previewCount?: number;
  /** Lugn översikt på Min dag, utan att skapa ytterligare en lista. */
  dayHeadings?: boolean;
  /** Compact rows for Today and calendar day tools; same data and actions. */
  presentation?: "card" | "integrated";
  /** Optional compact visual support; legacy cards always show pictograms. */
  showPictograms?: boolean;
}) {
  const integrated = presentation === "integrated";
  const { today, toggleItem } = useFlowItems(date);
  const [expanded, setExpanded] = useState(false);

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
      const schedule = item.source === "barn" || item.id.startsWith("childitem-") || item.id.startsWith("child-");
      const projected = schedule ? { ...item, done: false, completable: false } : item;
      const key = itemKey(projected);
      const previous = merged.get(key);
      if (!previous || (projected.done && !previous.done)) merged.set(key, projected);
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

  /**
   * Samma titel + tid visas som en rad. Tar man bort raden ska även dolda
   * kopior (t.ex. en äldre, oavslutad dag som rullat över) försvinna –
   * annars dyker kopian upp i samma ögonblick och det ser ut som att
   * borttagningen inte fungerade.
   */
  const duplicatesByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of [...today, ...extraItems]) {
      const key = itemKey(item);
      const ids = map.get(key) ?? [];
      if (!ids.includes(item.id)) ids.push(item.id);
      map.set(key, ids);
    }
    return map;
  }, [today, extraItems]);

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

  const hiddenCount =
    previewCount && !expanded ? Math.max(0, items.length - previewCount) : 0;
  const shownItems = hiddenCount > 0 ? items.slice(0, previewCount) : items;
  const firstTimedIndex = items.findIndex((item) => !!item.time);
  const firstUntimedIndex = items.findIndex((item) => !item.time);

  return (
    <>
      <ul className="divide-y divide-border/50" aria-label="Dagens innehåll">
        {shownItems.map((item, index) => {

          return (
            <li key={item.id}>
              {dayHeadings && index === firstTimedIndex && <h2 className={cn("px-2 pb-1 pt-3 text-primary", integrated ? "font-sans text-lg font-semibold leading-snug" : "font-display text-sm font-bold")}>Tider idag</h2>}
              {dayHeadings && index === firstUntimedIndex && <h2 className={cn("px-2 pb-1 pt-3 text-primary", integrated ? "font-sans text-lg font-semibold leading-snug" : "font-display text-sm font-bold")}>Övrigt idag</h2>}
              {index === nowIndex && (
                <div className="flex items-center gap-2 py-1" aria-label="Just nu">
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Nu
                  </span>
                  <span className="h-px flex-1 bg-primary/40" aria-hidden />
                </div>
              )}
              <ActivityRowTransition quiet={integrated} transitionKey={String(item.done)}>
                <DailyActivityRow
                  item={item}
                  integrated={integrated}
                  showPictograms={showPictograms}
                  onToggle={() => {
                    const wasDone = item.done;
                    toggleItem(item);
                    if (!wasDone) onCompleted?.(item);
                  }}
                  actions={
                    <FlowItemActions
                      itemId={item.id}
                      duplicateIds={duplicatesByKey.get(itemKey(item))}
                      size={14}
                      compact
                      className={cn("text-muted-foreground", integrated ? "h-11 w-11" : "h-9 w-9")}
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
                  }
                />
              </ActivityRowTransition>
            </li>
          );
        })}
      </ul>
      {previewCount != null && items.length > previewCount && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? "Visa färre" : `Visa alla (${items.length - previewCount} till)`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>
      )}

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

function ActivityRowTransition({ quiet, transitionKey, children }: { quiet: boolean; transitionKey: string; children: ReactNode }) {
  return quiet ? <>{children}</> : <MyFloveTransition transitionKey={transitionKey}>{children}</MyFloveTransition>;
}

export default DailyFlowList;
