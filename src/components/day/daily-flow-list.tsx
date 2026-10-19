import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, SlidersHorizontal } from "lucide-react";
import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { DailyActivityRow } from "./daily-activity-row";
import { FlowItemActions, kindFromId } from "@/components/flow-item-actions";
import { MyFloveTransition } from "@/components/myflove/motion";
import { paceEveryday } from "@/components/paceable/design-system";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { todayISO, type FlowItem } from "@/lib/flow-items";
import { cn } from "@/lib/utils";

function itemKey(item: FlowItem) {
  return `${item.title.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim()}|${item.time ?? ""}`;
}

function isChildSchedule(item: FlowItem) {
  return item.source === "barn" || item.id.startsWith("childitem-") || item.id.startsWith("child-");
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

export type DailyFlowFilter = "alla" | "viktigast" | "tid";

export function DailyFlowList({
  date,
  extraItems = [],
  onCompleted,
  previewCount,
  dayHeadings = false,
  presentation = "card",
  showPictograms = false,
  pictogramLibrary = "lucide",
  includeChildSchedules = true,
  showFilter = false,
  selectedFilter,
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
  pictogramLibrary?: "lucide" | "mulberry";
  /** Min dag visar egna aktiviteter; barnens schema finns i barn- och familjevyer. */
  includeChildSchedules?: boolean;
  /** Kompakt visningsfilter (Alla/Viktigast/Med tid) – filtrerar bara visningen, aldrig data. */
  showFilter?: boolean;
  selectedFilter?: DailyFlowFilter;
}) {
  const integrated = presentation === "integrated";
  const { today, toggleItem } = useFlowItems(date);
  const [expanded, setExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [localFilter, setFilter] = useState<DailyFlowFilter>("alla");
  const filter = selectedFilter ?? localFilter;

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
  const sourceItems = useMemo(
    () => [...today, ...extraItems].filter((item) => includeChildSchedules || !isChildSchedule(item)),
    [today, extraItems, includeChildSchedules],
  );
  const items = useMemo(() => {
    const merged = new Map<string, FlowItem>();
    for (const item of sourceItems) {
      const schedule = isChildSchedule(item);
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
  }, [sourceItems, orderMap, dayISO]);

  /**
   * Samma titel + tid visas som en rad. Tar man bort raden ska även dolda
   * kopior (t.ex. en äldre, oavslutad dag som rullat över) försvinna –
   * annars dyker kopian upp i samma ögonblick och det ser ut som att
   * borttagningen inte fungerade.
   */
  const duplicatesByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of sourceItems) {
      const key = itemKey(item);
      const ids = map.get(key) ?? [];
      if (!ids.includes(item.id)) ids.push(item.id);
      map.set(key, ids);
    }
    return map;
  }, [sourceItems]);

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

  /** Visningsfiltret ändrar bara vilka rader som syns – aldrig ordning, data eller avbockning. */
  const filteredItems = useMemo(() => {
    if (filter === "viktigast") return items.filter((item) => item.priority === "nu" && !item.done);
    if (filter === "tid") return items.filter((item) => !!item.time);
    return items;
  }, [items, filter]);

  if (items.length === 0 && !showFilter) {
    return (
      <p className="rounded-2xl bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
        Inget inplanerat den här dagen.
      </p>
    );
  }

  const hiddenCount =
    previewCount && !expanded ? Math.max(0, filteredItems.length - previewCount) : 0;
  const shownItems = hiddenCount > 0 ? filteredItems.slice(0, previewCount) : filteredItems;
  const firstTimedIndex = filteredItems.findIndex((item) => !!item.time);
  const firstUntimedIndex = filteredItems.findIndex((item) => !item.time);
  const reorderDisabled = filter !== "alla";

  return (
    <>
      {showFilter && items.length > 1 && <div className="mb-1 flex justify-end"><button type="button" aria-expanded={filterOpen} aria-controls="today-activity-filters" onClick={() => setFilterOpen(v => !v)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs text-muted-foreground hover:bg-secondary/50"><SlidersHorizontal size={16} aria-hidden />Filtrera{filter !== "alla" ? " · Aktivt" : ""}</button></div>}
      {showFilter && items.length > 1 && filterOpen && (
        <div id="today-activity-filters" role="group" aria-label="Filtrera dagens aktiviteter" className="mb-3 flex flex-wrap gap-1.5">
          {(
            [
              ["alla", "Alla"],
              ["viktigast", "Viktigast"],
              ["tid", "Med tid"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "min-h-11 rounded-xl border px-4 text-sm font-medium shadow-none transition-colors",
                filter === value
                  ? "border-primary/70 bg-lavender/60 text-ink"
                  : "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/40 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {filteredItems.length === 0 && items.length > 0 && (
        <p className="rounded-2xl bg-secondary/30 px-4 py-4 text-sm text-muted-foreground">
          {filter === "viktigast" ? "Inget är markerat som viktigast just nu." : "Inget med klockslag den här dagen."}
        </p>
      )}
      {items.length === 0 && <p className="rounded-2xl bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">Inget inplanerat den här dagen.</p>}
      <ul className={cn(integrated ? "space-y-0.5" : "divide-y divide-border/50")} aria-label="Dagens innehåll">
        {shownItems.map((item, index) => {

          return (
            <li key={item.id}>
              {dayHeadings && index === firstTimedIndex && <h2 className={cn("px-2 pb-0.5 pt-1 text-primary", integrated ? "font-sans text-base font-semibold leading-snug" : "font-display text-sm font-bold")}>Tider idag</h2>}
              {dayHeadings && index === firstUntimedIndex && <h2 className={cn("px-2 pb-0.5 pt-2 text-primary", integrated ? "font-sans text-lg font-semibold leading-snug" : "font-display text-sm font-bold")}>Övrigt idag</h2>}
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
                  pictogramLibrary={pictogramLibrary}
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
                      <DropdownMenuItem onSelect={() => move(items.indexOf(item), -1)} disabled={reorderDisabled || items.indexOf(item) === 0}>
                        <ArrowUp /> Flytta upp
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => move(items.indexOf(item), 1)} disabled={reorderDisabled || items.indexOf(item) === items.length - 1}>
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
      {previewCount != null && filteredItems.length > previewCount && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {expanded ? "Visa färre" : `Visa alla (${filteredItems.length - previewCount} till)`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>
      )}

      <Dialog open={!!adaptItem} onOpenChange={(o) => !o && setAdaptItem(null)}>
        <DialogContent className={paceEveryday.dialog}>
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
