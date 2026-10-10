import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, HeartPulse, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CollapsibleSection from "@/components/collapsible-section";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useMoods } from "@/hooks/use-data";
import {
  buildEnergyMoodTrend,
  type TrendPeriod,
  type TrendRange,
} from "@/lib/energy-mood-trend";

const RANGE_LABELS: Record<TrendRange, string> = {
  weeks: "Vecka",
  months: "Månad",
};

const RANGE_DESCRIPTIONS: Record<TrendRange, string> = {
  weeks: "Senaste 8 veckorna",
  months: "Senaste 6 månaderna",
};

export function EnergyMoodPeriods({ periods }: { periods: TrendPeriod[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const timelineId = useId();
  const [edges, setEdges] = useState({ start: true, end: true });
  const updateEdges = () => {
    const node = viewport.current;
    if (!node) return;
    setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 });
  };
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    node.scrollLeft = 0;
    updateEdges();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateEdges);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [periods]);
  const move = (direction: number) => {
    const node = viewport.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "auto" });
  };
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex justify-end gap-2">
        <Button type="button" size="icon" variant="ghost" title="Tidigare perioder" aria-label="Tidigare perioder" aria-controls={timelineId} disabled={edges.start} onClick={() => move(-1)}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <Button type="button" size="icon" variant="ghost" title="Senare perioder" aria-label="Senare perioder" aria-controls={timelineId} disabled={edges.end} onClick={() => move(1)}>
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <div ref={viewport} id={timelineId} onScroll={updateEdges} className="@container min-w-0 overflow-x-auto snap-x snap-proximity rounded-lg pb-2 focus-visible:outline-2 focus-visible:outline-ring" role="region" aria-label="Tidslinje för energi och mående" tabIndex={0}>
      <div className="flex w-max min-w-full gap-2 p-1" role="list" aria-label="Perioder" onKeyDown={(event) => {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="listitem"]'));
        const index = items.indexOf(event.target as HTMLElement);
        if (index < 0) return;
        const next = event.key === "ArrowRight" ? Math.min(index + 1, items.length - 1)
          : event.key === "ArrowLeft" ? Math.max(index - 1, 0)
          : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
        if (next == null) return;
        event.preventDefault();
        items[next]?.focus({ preventScroll: true });
        items[next]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
      }}>
      {periods.map((period) => {
        const description = `${period.accessibleLabel}: ${
          period.energy == null ? "ingen energilogg" : `energi ${period.energy} procent`
        }, ${period.mood == null ? "inget mående loggat" : `mående ${period.mood} procent`}`;
        return (
          <div
            key={period.key}
            role="listitem"
             tabIndex={0}
            aria-label={description}
            title={description}
            className="w-[min(6rem,calc(100cqw-12px))] shrink-0 snap-start rounded-lg text-center focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <div className="mx-auto flex h-20 w-full max-w-14 items-end justify-center gap-1 rounded-xl border border-border bg-background p-1">
              {period.energy != null && <span
                aria-hidden="true"
                data-series="energy"
                className="w-1/2 rounded-md bg-primary/70 transition-[height] duration-500 motion-reduce:transition-none"
                style={{ height: `${Math.max(6, period.energy)}%` }}
              />}
              {period.mood != null && <span
                aria-hidden="true"
                data-series="mood"
                className="w-1/2 rounded-md bg-accent/70 transition-[height] duration-500 motion-reduce:transition-none"
                style={{ height: `${Math.max(6, period.mood)}%` }}
              />}
            </div>
            <span className="mt-2 block text-xs font-medium leading-relaxed text-foreground">
              {period.label}
            </span>
             <span aria-hidden="true" className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">
               Energi {period.energy == null ? "–" : `${period.energy} %`}<br />
               Mående {period.mood == null ? "–" : `${period.mood} %`}
             </span>
          </div>
        );
      })}
      </div>
      </div>
    </div>
  );
}

/**
 * Insikter: energi och mående som trend över vecka och månad.
 * Bygger enbart på befintlig energilogg och måendelogg – beskrivande,
 * aldrig diagnostiskt.
 */
export default function EnergyMoodTrend() {
  const { entries } = useEnergyFlow();
  const { moods } = useMoods();
  const [range, setRange] = useState<TrendRange>("weeks");
  const trend = useMemo(() => buildEnergyMoodTrend(entries, moods), [entries, moods]);
  const periods = trend.periods[range];
  const TrendIcon =
    trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const hasData = periods.some((p) => p.energy != null || p.mood != null);

  return (
    <CollapsibleSection
      id="insight-energy-mood-trend"
      title="Energi & mående över tid"
      description="Hur dina veckor och månader har sett ut"
      className="@container min-w-0 rounded-3xl border border-border bg-card p-[12px] font-sans @[22rem]:p-[20px] [&>div:first-child>button]:min-h-11 [&>div:first-child>button]:min-w-0 [&>div:first-child>button>span]:break-words"
      headingClassName="font-semibold"
      data-testid="energy-mood-trend"
    >
      <div className="mt-4 space-y-4">
        <div className="min-w-0 rounded-2xl bg-secondary/40 p-[12px] @[30rem]:flex @[30rem]:items-start @[30rem]:gap-[12px] sm:p-[16px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendIcon size={18} aria-hidden />
          </span>
          <div className="mt-2 min-w-0 @[30rem]:mt-0">
            <p className="font-medium text-ink">{trend.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bygger på dina egna energisvar och måendekollar.
            </p>
          </div>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as TrendRange)}>
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-2xl @[16rem]:grid-cols-2 @[16rem]:rounded-full">
            {(Object.keys(RANGE_LABELS) as TrendRange[]).map((value) => (
              <TabsTrigger key={value} value={value} className="min-h-11 min-w-0 whitespace-normal rounded-full px-[8px]">
                {RANGE_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background/60 p-[8px] sm:p-[12px]">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" /> Energi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent/70" /> Mående
            </span>
          </div>
          <p className="mb-3 text-xs font-medium text-ink">{RANGE_DESCRIPTIONS[range]}</p>
          <EnergyMoodPeriods periods={periods} />
          {!hasData && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              <HeartPulse size={14} className="mr-1 inline text-primary" aria-hidden />
              Trenden fylls på när du loggar hur något kändes eller gör en måendekoll.
            </p>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Staplarna visar ett snitt per period, inte en bedömning. Perioder utan loggar lämnas
          tomma.
        </p>
      </div>
    </CollapsibleSection>
  );
}
