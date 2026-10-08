import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, Brain, BatteryMedium, Heart, ChevronDown } from "lucide-react";
import { FlowMascot } from "@/components/flow-mascot";
import { ENERGY_META, ENERGY_CHOICES } from "@/lib/activity-history";
import type { WeekReview } from "@/lib/week-review";
import { track } from "@/lib/analytics";
import { useLang } from "@/hooks/use-language";
import { useCollapsible } from "@/lib/collapse-store";
import { cn } from "@/lib/utils";

/**
 * 💜 Din vecka – lugn sammanfattning av veckan som varit.
 *
 * Inga grafer att tolka. Bara det MyFlove faktiskt sett i din egen data,
 * och milda förslag som alltid är frivilliga.
 */
export function WeekReviewCard({
  review,
  showLink = true,
}: {
  review: WeekReview;
  showLink?: boolean;
}) {
  const { t } = useLang();
  const { collapsed, toggle } = useCollapsible("home-week-review");
  useEffect(() => {
    track("week_review_viewed");
  }, []);

  const rows = [
    { icon: CalendarDays, label: t("Aktiviteter"), value: `${review.activityCount}` },
    { icon: Brain, label: t("Fånga"), value: `${review.quickflowCount} ${t("saker")}` },
    { icon: BatteryMedium, label: t("Ork"), value: t(review.energyLabel) },
    { icon: Heart, label: t("Mående"), value: t(review.moodLabel) },
  ];

  return (
    <section
      aria-label={t("Din vecka")}
      data-testid="week-review"
      className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <FlowMascot size="xs" mood="calm" className="mt-0.5 shrink-0 flow-alive" alt="" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex w-full items-center gap-2 text-left"
          >
            <h2 className="min-w-0 flex-1 text-base font-semibold text-ink">{t("💜 Din vecka")}</h2>
            <ChevronDown
              size={18}
              className={cn(
                "text-muted-foreground transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </button>
          {!collapsed && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("Den här veckan, i lugn takt")}
            </p>
          )}

          {!collapsed && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-2 rounded-2xl bg-lavender/25 px-3 py-2"
                >
                  <row.icon size={16} className="shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[11px] text-muted-foreground">{row.label}</dt>
                    <dd className="truncate text-sm font-medium text-ink">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}

          {!collapsed && (
            <p className="mt-3 text-sm leading-relaxed text-ink">{t(review.summary)}</p>
          )}

          {!collapsed && review.enoughData && review.completedCount > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {ENERGY_CHOICES.filter((c) => review.impact[c] > 0).map((choice) => (
                <li
                  key={choice}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-ink"
                >
                  {ENERGY_META[choice].dot} {t(ENERGY_META[choice].label)} · {review.impact[choice]}
                </li>
              ))}
            </ul>
          )}

          {!collapsed && review.observations.length > 1 && (
            <ul className="mt-3 space-y-1.5">
              {review.observations.slice(1).map((line) => (
                <li key={line} className="text-sm text-ink">
                  • {t(line)}
                </li>
              ))}
            </ul>
          )}

          {!collapsed && review.suggestions.length > 0 && (
            <div className="mt-4 rounded-2xl bg-lavender/30 p-3">
              <p className="text-sm font-medium text-ink">{t("Inför nästa vecka 💜")}</p>
              <ul className="mt-1.5 space-y-1.5">
                {review.suggestions.map((line) => (
                  <li key={line} className="text-sm text-ink">
                    {t(line)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("Helt frivilligt – bara om du vill.")}
              </p>
            </div>
          )}

          {!collapsed && showLink && (
            <Link
              href="/historik"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("Se din historik")} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default WeekReviewCard;
