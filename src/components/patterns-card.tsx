import { TrendingUp } from "lucide-react";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";
import { energyByDay, impactPatterns } from "@/lib/capacity-patterns";
import { useLang } from "@/hooks/use-language";

/**
 * Mina mönster – helt valfritt att titta på. Hopfällt som standard så att
 * Mitt batteri förblir lugnt. Visar bara mönster som bygger på användarens
 * egna registreringar, med försiktiga formuleringar. Saknas underlag visas
 * en lugn förklaring i stället för påhittade mönster.
 */
export default function PatternsCard() {
  const { t } = useLang();
  const { impactHistory } = useImpactCheckin();
  const [energyLog] = useCloudSyncedStorage<EnergyLogEntry[]>("myflove-energy-log", []);

  const byDay = energyByDay(energyLog ?? []);
  const patterns = impactPatterns(impactHistory, byDay);

  return (
    <ExpandableBlock
      historyStyle
      title={t("Insikter")}
      titleText={t("Insikter")}
      subtitle={t("Observationer ur din egen data – titta bara när du vill.")}
      summary={
        patterns.length > 0
          ? t("Det finns mönster att se när du öppnar.")
          : t("Vi visar mönster här när du registrerat lite mer.")
      }
      icon={TrendingUp}
      tone="lavender"
      area="halsa"
      data-testid="patterns-card"
    >
      {patterns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(
            "Ännu finns inget tydligt mönster. När du checkat in några dagar kan Paceable visa försiktiga mönster ur din egen data – aldrig påhittade.",
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {patterns.map((p) => (
            <li key={p.id} className="rounded-2xl bg-lavender/20 px-3 py-2.5 text-sm text-ink">
              {t(p.textSv)}
            </li>
          ))}
        </ul>
      )}
    </ExpandableBlock>
  );
}
