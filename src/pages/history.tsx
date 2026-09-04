import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import WeekReviewCard from "@/components/week-review-card";
import { useActivityHistory, useWeekReview } from "@/hooks/use-activity-history";
import {
  ENERGY_CHOICES,
  ENERGY_META,
  STATUS_LABELS,
  groupByDay,
  type ActivityEnergy,
} from "@/lib/activity-history";
import { weekDates, weekStartISO, weekdayName } from "@/lib/week-review";
import { addDaysISO, todayISO, parseISODate } from "@/lib/day";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { useLang } from "@/hooks/use-language";

function formatDay(iso: string, locale: string): string {
  const d = parseISODate(iso);
  const month = d.toLocaleDateString(locale, { month: "long" });
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  return `${weekday} ${d.getDate()} ${month}`;
}

/**
 * Historik – vad hände den här dagen?
 *
 * Visar bara faktiska datuminstanser: varje förekomst av en återkommande
 * aktivitet har sin egen dag, sin egen status och sin egen energipåverkan.
 */
export default function History() {
  const { t, locale } = useLang();
  useEffect(() => {
    track("history_viewed");
  }, []);

  const [weekStart, setWeekStart] = useState(() => weekStartISO(todayISO()));
  const { instancesBetween, setEnergy } = useActivityHistory();
  const review = useWeekReview(weekStart);

  const days = weekDates(weekStart);
  const instances = useMemo(
    () => instancesBetween(days[0]!, days[6]!),
    [instancesBetween, days],
  );
  const grouped = groupByDay(instances);
  const isCurrentWeek = weekStart === weekStartISO(todayISO());

  return (
    <Layout>
      <MyFlovePageGrid area="flow">
        <MyFloveWide>
          <div className="space-y-6">
            <header>
              <h1 className="text-3xl font-bold text-ink">{t("Historik")}</h1>
              <p className="mt-1 text-muted-foreground">
                {t("Vad hände de här dagarna – och hur påverkade det din ork?")}
              </p>
            </header>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm text-ink"
              >
                <ChevronLeft size={16} aria-hidden /> {t("Förra veckan")}
              </button>
              <p className="text-sm text-muted-foreground">
                {formatDay(days[0]!, locale)} – {formatDay(days[6]!, locale)}
              </p>
              <button
                type="button"
                disabled={isCurrentWeek}
                onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm text-ink disabled:opacity-40"
              >
                {t("Nästa")} <ChevronRight size={16} aria-hidden />
              </button>
            </div>

            <WeekReviewCard review={review} showLink={false} />

            {grouped.length === 0 ? (
              <p className="rounded-3xl border border-border/60 bg-card p-5 text-sm text-muted-foreground shadow-soft">
                {t("Inga aktiviteter den här veckan.")}
              </p>
            ) : (
              grouped.map((day) => (
                <section
                  key={day.date}
                  aria-label={formatDay(day.date, locale)}
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
                >
                  <h2 className="text-base font-semibold capitalize text-ink">
                    {formatDay(day.date, locale)}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {day.items.map((item) => (
                      <li key={item.key} className="rounded-2xl bg-lavender/20 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">
                            {item.startTime ? `${item.startTime} · ` : ""}
                            {item.title}
                          </span>
                          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {t(STATUS_LABELS[item.status])}
                          </span>
                          {item.energyImpact && (
                            <span className="text-xs text-ink">
                              {ENERGY_META[item.energyImpact].dot}{" "}
                              {t(ENERGY_META[item.energyImpact].label)}
                            </span>
                          )}
                        </div>
                        {item.status === "genomford" && !item.energyImpact && (
                          <div className="mt-2">
                            <p className="text-[11px] text-muted-foreground">
                              {t("Hur påverkade den din ork? (frivilligt)")}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {ENERGY_CHOICES.map((choice: ActivityEnergy) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() => setEnergy(item.sourceId, item.plannedDate, choice)}
                                  className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs text-ink hover:border-primary"
                                >
                                  {ENERGY_META[choice].dot} {t(ENERGY_META[choice].label)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.expectedEnergy && item.energyImpact && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {t("Du trodde")}: {t(ENERGY_META[item.expectedEnergy].ask)} · {t("Det blev")}:{" "}
                            {t(ENERGY_META[item.energyImpact].ask)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
