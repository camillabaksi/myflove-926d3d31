import type { ReactNode } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, Link2, Video } from "lucide-react";
import { MulberryPictogram } from "@/components/calendar/mulberry-pictogram";
import { mulberryForTitle } from "@/lib/mulberry-symbols";
import { ActivityPictogram } from "@/components/family/activity-pictogram";
import { Button } from "@/components/ui/button";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import { SOURCE_LABEL, type FlowItem } from "@/lib/flow-items";
import { areaChipStyle, areaColor } from "@/lib/life-areas";
import { cn } from "@/lib/utils";

/** Presentation only: callers own completion, menus and persistence. */
export function DailyActivityRow({
  item,
  integrated = false,
  showPictograms = false,
  pictogramLibrary = "lucide",
  onToggle,
  actions,
}: {
  item: FlowItem;
  integrated?: boolean;
  showPictograms?: boolean;
  pictogramLibrary?: "lucide" | "mulberry";
  onToggle?: () => void;
  actions: ReactNode;
}) {
  const visual = dailyActivityVisual(item);
  const visualColor = visual.colorArea ? areaColor(visual.colorArea) : undefined;
  const visualChip = visual.colorArea ? areaChipStyle(visual.colorArea) : undefined;
  const areaSurface = visualColor ? {
    backgroundColor: `color-mix(in srgb, ${visualColor} 12%, hsl(var(--card)))`,
    borderLeft: `3px solid ${visualColor}`,
  } : undefined;
  return (
    <div
      className={cn(
        integrated
          ? "pace-activity-row relative min-w-0 rounded-xl px-2 py-1"
          : "relative my-2 overflow-hidden rounded-2xl border border-border/60 bg-card px-2.5 py-3 shadow-sm sm:px-3",
        !integrated && item.done && "bg-muted/35 opacity-70",
      )}
      style={areaSurface}
    >
      <div
        className={cn(
          "pace-activity-row-grid grid min-w-0 items-center",
          integrated
            ? showPictograms
              ? pictogramLibrary === "mulberry"
                ? "pace-activity-row-pictograms grid-cols-[2.25rem_2rem_minmax(0,1fr)_2.75rem] gap-1"
                : "pace-activity-row-pictograms grid-cols-[2.25rem_1.5rem_minmax(0,1fr)_2.75rem] gap-1"
              : "grid-cols-[2.25rem_0.5rem_minmax(0,1fr)_2.75rem] gap-1 sm:gap-1.5"
            : "grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_auto] gap-2 sm:grid-cols-[3rem_3rem_minmax(0,1fr)_auto] sm:gap-3",
        )}
      >
        <span className="text-center text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
          {item.time ?? ""}
        </span>
        {integrated && !showPictograms ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            style={visualColor ? { backgroundColor: visualColor } : undefined}
            aria-hidden
          />
        ) : pictogramLibrary === "mulberry" ? (
          <MulberryPictogram id={mulberryForTitle(item.title, visual.pictogram)} tone={visual.tone} className="h-7 w-7" />
        ) : (
          <ActivityPictogram
            id={visual.pictogram}
            tone={visual.tone}
            className={integrated ? "h-6 w-6 rounded-lg" : "h-11 w-11 rounded-xl sm:h-12 sm:w-12"}
            iconClassName={integrated ? "h-4 w-4" : "h-6 w-6 sm:h-7 sm:w-7"}
            style={visualColor ? { color: visualColor } : undefined}
          />
        )}
        <div className="pace-activity-row-text min-w-0">
          <div className={cn("flex min-w-0 gap-1", integrated ? "items-center" : "items-start")}>
            {item.completable && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggle}
                aria-label={item.done ? `Ångra ${item.title}` : `Klarmarkera ${item.title}`}
                className={cn(
                  "-ml-1 shrink-0 rounded-full text-muted-foreground hover:text-primary",
                  integrated ? "h-9 w-9" : "h-8 w-8",
                )}
              >
                {item.done ? (
                  <CheckCircle2 className={integrated ? "text-muted-foreground" : "text-primary"} />
                ) : (
                  <Circle />
                )}
              </Button>
            )}
            <div className="min-w-0 flex-1">
            <p
              className={cn(
                "pace-type-activity min-w-0 break-words leading-snug",
                integrated
                  ? "font-sans text-base font-semibold text-ink"
                  : "font-display pt-0.5 text-xl font-semibold text-ink",
                item.done && "line-through",
                integrated && item.done && "font-normal text-muted-foreground",
              )}
            >
              {(item.href?.startsWith("/aterhamtning?start=") || item.href === "/stop-paus") ? <Link href={item.href} className="rounded-sm underline decoration-primary/40 underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Öppna ${item.title}`}>{item.title}</Link> : item.title}
            </p>
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-1.5",
              integrated ? "mt-0" : "mt-1",
            )}
          >
            <span
              className={cn(
                "pace-type-category",
                integrated
                  ? "text-xs text-muted-foreground"
                  : "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              )}
              style={integrated ? undefined : visualChip}
            >
              {visual.label}
            </span>
            {(!integrated || SOURCE_LABEL[item.source] !== visual.label) && (
              <span className="pace-type-category text-[10px] font-medium text-muted-foreground">
                {integrated && <span aria-hidden>· </span>}{SOURCE_LABEL[item.source]}
              </span>
            )}
            {item.linkedLabel && (
              <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Link2 size={11} aria-hidden />
                <span className="sr-only">Kopplad familjeaktivitet:</span>
                <span className="truncate">{item.linkedLabel}</span>
              </span>
            )}
          </div>
            </div>
          </div>
          {item.meetingUrl && (
            <a
              href={item.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
                item.completable && (integrated ? "ml-11" : "sm:ml-7"),
              )}
            >
              <Video size={13} aria-hidden />
              {/zoom\.us/i.test(item.meetingUrl)
                ? "Anslut till Zoom"
                : /meet\.google/i.test(item.meetingUrl)
                  ? "Anslut till Meet"
                  : "Anslut till Teams"}
            </a>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}
