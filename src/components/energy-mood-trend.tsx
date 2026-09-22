import { useMemo, useState } from "react";
import { HeartPulse, TrendingDown, TrendingUp, Minus } from "lucide-react";
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

function Bars({ periods }: { periods: TrendPeriod[] }) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="list">
      {periods.map((period) => {
        const description = `${period.accessibleLabel}: ${
          period.energy == null ? "ingen energilogg" : `energi ${period.energy} procent`
        }, ${period.mood == null ? "inget mående loggat" : `mående ${period.mood} procent`}`;
        return (
          <div
            key={period.key}
            role="listitem"
            aria-label={description}
            title={description}
            className="min-w-0 text-center"
          >
            <div className="mx-auto flex h-20 w-full max-w-14 items-end justify-center gap-1 rounded-xl border border-border bg-background p-1">
              <span
                className="w-1/2 rounded-md bg-primary/70 transition-[height] duration-500"
                style={{ height: `${period.energy == null ? 3 : Math.max(6, period.energy)}%` }}
              />
              <span
                className="w-1/2 rounded-md bg-accent/70 transition-[height] duration-500"
                style={{ height: `${period.mood == null ? 3 : Math.max(6, period.mood)}%` }}
              />
            </div>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
              {period.label}
            </span>
          </div>
        );
      })}
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
      className="rounded-3xl border border-border bg-card p-5"
      headingClassName="font-semibold"
      data-testid="energy-mood-trend"
    >
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendIcon size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{trend.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bygger på dina egna energisvar och måendekollar.
            </p>
          </div>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as TrendRange)}>
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            {(Object.keys(RANGE_LABELS) as TrendRange[]).map((value) => (
              <TabsTrigger key={value} value={value} className="rounded-full">
                {RANGE_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="overflow-hidden rounded-2xl border border-border bg-background/60 p-3">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" /> Energi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent/70" /> Mående
            </span>
          </div>
          <p className="mb-3 text-xs font-medium text-ink">{RANGE_DESCRIPTIONS[range]}</p>
          <Bars periods={periods} />
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
