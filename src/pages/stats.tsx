import { PacePageHeader } from "@/components/paceable/page-header";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useMoods } from "@/hooks/use-data";
import { getWeeklyMoodStats } from "@/lib/mood-stats";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import SoftWaveChart from "@/components/soft-wave-chart";
import CollapsibleSection from "@/components/collapsible-section";

const EMOJI_BY_ROUNDED_SCORE: Record<number, string> = {
  1: "😢",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export default function Stats() {
  const { moods } = useMoods();
  const { days, weekAvg, trend, checkins } = getWeeklyMoodStats(moods);

  const trendLabel =
    trend === "up"
      ? { text: "På väg uppåt jämfört med förra veckan", icon: TrendingUp, color: "text-primary" }
      : trend === "down"
        ? {
            text: "Lite lägre än förra veckan — det är okej, allt går i vågor",
            icon: TrendingDown,
            color: "text-orange-600",
          }
        : trend === "same"
          ? { text: "Ungefär som förra veckan", icon: Minus, color: "text-muted-foreground" }
          : null;

  const TrendIcon = trendLabel?.icon;

  return (
    <Layout>
      <MyFlovePageGrid area="flow" className="pace-ds pace-compact-page">
        <MyFloveWide>
          <div className="space-y-8 pace-compact-stack">
<PacePageHeader icon={BarChart3} title="Veckostatistik" description="Så har ditt mående sett ut den senaste veckan." />

            <CollapsibleSection
              title="Den här veckan"
              id="weekly-mood-statistics"
              headingClassName="text-base font-semibold"
              className="pace-card-surface bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Snitt denna vecka
                  </p>
                  <p className="text-3xl font-bold">
                    {weekAvg !== null ? weekAvg.toFixed(1) : "–"}
                    {weekAvg !== null && (
                      <span className="text-lg text-muted-foreground font-normal"> / 5</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Incheckningar
                  </p>
                  <p className="text-3xl font-bold">{checkins}</p>
                </div>
              </div>

              <div role="img" aria-label={`Mående per dag: ${days.map((d) => `${d.label} ${d.avg !== null ? d.avg.toFixed(1) : "ingen incheckning"}`).join(", ")}`}>
                <SoftWaveChart series={[{ id: "mood", tone: "primary", values: days.map((d) => (d.avg !== null ? (d.avg / 5) * 100 : null)) }]} />
                <div className="mt-2 flex justify-between gap-1" aria-hidden="true">
                  {days.map((day) => (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-lg">{day.avg !== null ? EMOJI_BY_ROUNDED_SCORE[Math.round(day.avg)] : ""}</span>
                      <span className="text-xs text-muted-foreground font-medium">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {trendLabel && TrendIcon && (
                <div
                  className={`flex items-center gap-2 pt-2 border-t border-border ${trendLabel.color}`}
                >
                  <TrendIcon size={18} />
                  <p className="text-sm font-medium">{trendLabel.text}</p>
                </div>
              )}

              {checkins === 0 && (
                <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">
                  Ingen data än denna vecka — checka in ditt mående på startsidan för att se din
                  statistik här.
                </p>
              )}
            </CollapsibleSection>

            <Link
              href="/admin-statistik"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground justify-center pt-2"
            >
              <BarChart3 size={16} /> Se appstatistik (för dig som utvecklar/testar appen)
            </Link>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
