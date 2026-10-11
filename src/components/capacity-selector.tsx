import { Link } from "wouter";
import { Heart } from "lucide-react";
import { CapacityBattery } from "@/components/calendar/capacity-battery";
import { Button } from "@/components/ui/button";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useLang } from "@/hooks/use-language";
import { todayISO } from "@/lib/day";
import { cn } from "@/lib/utils";

export default function CapacitySelector({
  className,
  title = "Din kapacitet idag",
  showHelper = true,
  onCheckin,
}: {
  className?: string;
  title?: string;
  showHelper?: boolean;
  /** Öppnar det befintliga formuläret när kontrollen redan finns på batterisidan. */
  onCheckin?: () => void;
}) {
  const { t } = useLang();
  const capacity = useDayCapacity()(todayISO());

  return (
    <section
      className={cn("rounded-3xl border border-border/60 bg-card p-5 shadow-soft", className)}
    >
      <p className="font-display text-lg font-bold text-ink">{t(title)}</p>
      {showHelper && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t(
            capacity.percent === null
              ? "Hur börjar du dagen?"
              : "Utifrån din egen registrering idag.",
          )}
        </p>
      )}
      {capacity.percent === null ? (
        onCheckin ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 min-h-11 rounded-2xl"
            onClick={onCheckin}
          >
            <Heart size={16} />
            {t("Checka in")}
          </Button>
        ) : (
          <Button asChild variant="outline" className="mt-4 min-h-11 rounded-2xl">
            <Link href="/mitt-batteri">
              <Heart size={16} />
              {t("Checka in")}
            </Link>
          </Button>
        )
      ) : (
        <CapacityBattery percent={capacity.percent} size="lg" className="mt-4 w-full" />
      )}
    </section>
  );
}
