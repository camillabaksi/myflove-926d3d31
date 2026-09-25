import { useMemo } from "react";
import { HeartHandshake } from "lucide-react";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useLocalStorage } from "@/lib/storage";
import { orkWord } from "@/lib/ork-word";
import { useLang } from "@/hooks/use-language";

/**
 * Påverkan → batteri, alltid som fråga.
 * Batteriprocenten ändras aldrig automatiskt av påverkan. Men om användaren
 * själv registrerat att något påverkar kapaciteten idag, och batteriet står
 * högre än vad det brukar innebära, föreslår kortet varsamt en lägre nivå.
 * Användaren godkänner alltid själv – eller avböjer för resten av dagen.
 */

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Föreslagen nivå (0–100) utifrån grad – varsamma steg, aldrig under 20. */
function suggestedLevel(degree: "lite" | "mattligt" | "mycket", timing: "nu" | "tidigare"): number {
  const base = degree === "mycket" ? 30 : degree === "mattligt" ? 50 : 70;
  // Något som redan har påverkat väger lite lättare än det som pågår just nu.
  return timing === "tidigare" ? base + 10 : base;
}

export default function ImpactBatteryNudge() {
  const { t } = useLang();
  const { impact } = useImpactCheckin();
  const { reading } = useEnergyBattery();
  const { logEnergy } = useQuickCheckin();
  // Avböjer användaren ska vi inte fråga igen samma dag.
  const [dismissed, setDismissed] = useLocalStorage<string | null>(
    "myflove-impact-nudge-dismissed",
    null,
  );

  const suggestion = useMemo(() => {
    if (!impact) return null;
    if (impact.kinds.includes("inget")) return null;
    if (dismissed === todayKey()) return null;
    const target = suggestedLevel(impact.degree, impact.timing ?? "nu");
    // Fråga bara om batteriet ligger tydligt över det som verkar rimligt.
    if (reading.now <= target + 8) return null;
    return Math.round(target / 5) * 5;
  }, [impact, reading.now, dismissed]);

  if (!suggestion) return null;

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
            {t("Du har sagt att något påverkar dig idag. Vill du sänka batteriet till")}{" "}
            <strong>{t(orkWord(suggestion).label).toLocaleLowerCase("sv")}</strong>?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void logEnergy(Math.round(suggestion / 10));
                setDismissed(todayKey());
              }}
              className="press rounded-pill bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              {t("Ja, sätt")} {t(orkWord(suggestion).label).toLocaleLowerCase("sv")}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(todayKey())}
              className="press rounded-pill bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {t("Nej tack, det stämmer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
