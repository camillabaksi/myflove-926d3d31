import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveInsightGather } from "@/components/myflove/motion";
import { useMoods } from "@/hooks/use-data";
import { getWeeklyMoodStats } from "@/lib/mood-stats";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Link } from "wouter";
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
      <MyFlovePageGrid area="flow">
        <MyFloveWide>
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                Veckostatistik <MyFloveInsightGather className="shrink-0" />
              </h1>
              <p className="text-muted-foreground">
                Så har ditt mående sett ut den senaste veckan.
              </p>
            </div>

            <CollapsibleSection
              title="Den här veckan"
              id="weekly-mood-statistics"
              headingClassName="text-base font-semibold"
              className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border"
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

              <div className="flex items-end justify-between gap-2 h-40">
                {days.map((day) => {
                  const heightPct = day.avg !== null ? Math.max(10, (day.avg / 5) * 100) : 4;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-lg">
                        {day.avg !== null ? EMOJI_BY_ROUNDED_SCORE[Math.round(day.avg)] : ""}
                      </span>
                      <div
                        className={`w-full rounded-xl transition-all duration-500 ${
                          day.avg !== null ? "bg-primary" : "bg-secondary"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-xs text-muted-foreground font-medium">{day.label}</span>
                    </div>
                  );
                })}
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
