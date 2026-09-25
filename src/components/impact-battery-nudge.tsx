import { useMemo } from "react";
import { HeartHandshake } from "lucide-react";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useLocalStorage } from "@/lib/storage";
import { CAPACITY_META, type CapacityMode } from "@/lib/priority-engine";
import { useLang } from "@/hooks/use-language";

/**
 * Påverkan → kapacitetsläge, alltid som fråga.
 * Läget ändras aldrig automatiskt. Om användaren själv registrerat att något
 * påverkar hen idag och läget är högre än vad det brukar innebära, föreslår
 * kortet varsamt ett lägre läge. Användaren godkänner alltid själv.
 */

const todayKey = () => new Date().toISOString().slice(0, 10);
const ORDER: CapacityMode[] = ["fullt", "mellan", "lagt"];

function suggestedMode(degree: "lite" | "mattligt" | "mycket"): CapacityMode {
  return degree === "mycket" ? "lagt" : degree === "mattligt" ? "mellan" : "fullt";
}

export default function ImpactBatteryNudge() {
  const { t } = useLang();
  const { impact } = useImpactCheckin();
  const { mode, setMode } = useCapacityMode();
  const [dismissed, setDismissed] = useLocalStorage<string | null>(
    "myflove-impact-nudge-dismissed",
    null,
  );

  const suggestion = useMemo<CapacityMode | null>(() => {
    if (!impact) return null;
    if (impact.kinds.includes("inget")) return null;
    if (dismissed === todayKey()) return null;
    const target = suggestedMode(impact.degree);
    return ORDER.indexOf(target) > ORDER.indexOf(mode) ? target : null;
  }, [impact, mode, dismissed]);

  if (!suggestion) return null;
  const label = `${CAPACITY_META[suggestion].dot} ${t(CAPACITY_META[suggestion].label)}`;

  return (
    <div
      data-testid="impact-battery-nudge"
      className="rounded-2xl border border-primary/20 bg-secondary/40 px-3.5 py-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <HeartHandshake size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-ink">
            {t("Du har sagt att något påverkar dig idag. Vill du byta kapacitetsläge till")}{" "}
            <strong>{label}</strong>?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMode(suggestion);
                setDismissed(todayKey());
              }}
              className="press min-h-11 rounded-pill bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              {t("Ja, byt till")} {label}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(todayKey())}
              className="press min-h-11 rounded-pill bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {t("Nej tack, det stämmer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
