import { Link } from "wouter";
import { BatteryMedium } from "lucide-react";
import CapacitySelector from "@/components/capacity-selector";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";

/**
 * Hemsidans enda kapacitetskontroll. Tryck på rubriken → Mitt batteri.
 */
export default function CapacityPlanCard() {
  const { t } = useLang();
  return (
    <div data-testid="capacity-plan" className="space-y-2">
      <CapacitySelector />
      <Link
        href="/mitt-batteri"
        onClick={() => track("home_widget_opened", { source: "kapacitet-till-batteri" })}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4"
      >
        <BatteryMedium className="h-4 w-4" aria-hidden /> {t("Se mitt batteri och mönster")}
      </Link>
    </div>
  );
}
