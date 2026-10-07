import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, Circle, Link2, Video } from "lucide-react";
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
  previewCount,
  dayHeadings = false,
  presentation = "card",
}: {
  date?: string;
  extraItems?: FlowItem[];
  onCompleted?: (item: FlowItem) => void;
  /** Visa bara de första punkterna och låt resten fällas ut. */
  previewCount?: number;
  /** Lugn översikt på Min dag, utan att skapa ytterligare en lista. */
  dayHeadings?: boolean;
  /** Today-only presentation; no changes to data or actions. */
  presentation?: "card" | "integrated";
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

          const visual = dailyActivityVisual(item);
          const visualColor = visual.colorArea ? areaColor(visual.colorArea) : undefined;
          const visualChip = visual.colorArea ? areaChipStyle(visual.colorArea) : undefined;
          return (
            <li key={item.id}>
              {dayHeadings && index === firstTimedIndex && <h2 className="px-2 pb-1 pt-3 font-display text-sm font-bold text-primary">Tider idag</h2>}
              {dayHeadings && index === firstUntimedIndex && <h2 className="px-2 pb-1 pt-3 font-display text-sm font-bold text-primary">Övrigt idag</h2>}
              {index === nowIndex && (
                <div className="flex items-center gap-2 py-1" aria-label="Just nu">
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Nu
                  </span>
                  <span className="h-px flex-1 bg-primary/40" aria-hidden />
                </div>
              )}
              <ActivityRowTransition quiet={integrated} transitionKey={String(item.done)}>
                <div
                  className={cn(
                    integrated ? "relative min-w-0 py-2" : "relative my-2 overflow-hidden rounded-2xl border border-border/60 bg-card px-2.5 py-3 shadow-sm sm:px-3",
                    !integrated && item.done && "bg-muted/35 opacity-70",
                  )}
                  style={!integrated && visualColor ? { borderLeft: `4px solid ${visualColor}` } : undefined}
                >
                  <div className={cn("grid min-w-0 items-center", integrated ? "grid-cols-[2.5rem_0.5rem_minmax(0,1fr)_2.75rem] gap-1.5 sm:gap-2" : "grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[3rem_3rem_minmax(0,1fr)_auto] sm:gap-3")}>
                    <span className="text-center text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
                      {item.time ?? ""}
                    </span>
                    {integrated ? <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" style={visualColor ? { backgroundColor: visualColor } : undefined} aria-hidden /> : <ActivityPictogram
                      id={visual.pictogram}
                      tone={visual.tone}
                      className="h-11 w-11 rounded-xl sm:h-12 sm:w-12"
                      iconClassName="h-6 w-6 sm:h-7 sm:w-7"
                      style={visualColor ? { color: visualColor } : undefined}
                    />}
                    <div className="min-w-0">
                      <div className={cn("flex min-w-0 gap-1", integrated ? "items-center" : "items-start")}>
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
                            className={cn("-ml-1 shrink-0 rounded-full text-muted-foreground hover:text-primary", integrated ? "h-11 w-11" : "h-8 w-8")}
                          >
                            {item.done ? <CheckCircle2 className={integrated ? "text-muted-foreground" : "text-primary"} /> : <Circle />}
                          </Button>
                        )}
                        <p className={cn("font-display min-w-0 flex-1 break-words leading-snug", integrated ? "text-base font-semibold text-ink" : "pt-0.5 text-xl font-semibold text-ink", item.done && "line-through", integrated && item.done && "font-normal text-muted-foreground")}>
                          {item.title}
                        </p>
                      </div>
                      <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5", integrated ? "mt-0.5" : "mt-1", item.completable && (integrated ? "pl-11" : "sm:pl-7"))}>
                        <span className={integrated ? "text-xs text-muted-foreground" : "rounded-full border px-2 py-0.5 text-[10px] font-semibold"} style={integrated ? undefined : visualChip}>
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
                      {item.meetingUrl && (
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary", item.completable && (integrated ? "ml-11" : "sm:ml-7"))}
                        >
                          <Video size={13} aria-hidden />
                          {/zoom\.us/i.test(item.meetingUrl) ? "Anslut till Zoom" : /meet\.google/i.test(item.meetingUrl) ? "Anslut till Meet" : "Anslut till Teams"}
                        </a>
                      )}
                    </div>
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
                  </div>
                </div>
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
