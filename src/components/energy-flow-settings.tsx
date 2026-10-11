import { MyFloveCard, MyFloveChip } from "@/components/myflove";
import { Switch } from "@/components/ui/switch";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useLang } from "@/hooks/use-language";
import {
  categoryWeightFor,
  ENERGY_CATEGORIES,
  WEIGHT_LABEL,
  type EnergyFlowWeight,
} from "@/lib/energy-flow";

const WEIGHTS: EnergyFlowWeight[] = ["av", "lite", "normal", "mycket"];
const SHORT: Record<EnergyFlowWeight, string> = {
  av: "Av",
  lite: "Lite",
  normal: "Normalt",
  mycket: "Mycket",
};

/**
 * Inställningar för hur energiflödet får påverka FlowScore:
 * ett huvudreglage plus egen vikt för varje energifaktor.
 */
export default function EnergyFlowSettings() {
  const { t } = useLang();
  const { settings, setSettings } = useEnergyFlow();
  const off = !settings.enabled;

  return (
    <div className="space-y-4">
      <MyFloveCard className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-ink">
              {t("Använd energipåverkan i appens beräkningar")}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                "Gäller den beräknade kurvan och planeringsförslagen. Din egen registrerade kapacitet ändras inte. Dina poster finns kvar när du stänger av.",
              )}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
            aria-label="Slå på eller av energipåverkan"
          />
        </div>
      </MyFloveCard>

      <MyFloveCard className={`space-y-3 ${off ? "opacity-50" : ""}`}>
        <div>
          <div className="font-medium text-ink">Hur mycket totalt?</div>
          <p className="text-sm text-muted-foreground">Gäller allt energiflöde tillsammans.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEIGHTS.map((w) => (
            <MyFloveChip
              key={w}
              active={settings.weight === w}
              onClick={() => !off && setSettings({ ...settings, weight: w })}
            >
              {WEIGHT_LABEL[w]}
            </MyFloveChip>
          ))}
        </div>
      </MyFloveCard>

      <MyFloveCard className={`space-y-4 ${off ? "opacity-50" : ""}`}>
        <div>
          <div className="font-medium text-ink">Vikt per energifaktor</div>
          <p className="text-sm text-muted-foreground">
            Varje faktor ställs för sig. Vill du t.ex. att sömn ska väga tungt men socialt inte alls
            – välj bara det här nedanför.
          </p>
        </div>
        <div className="space-y-3">
          {ENERGY_CATEGORIES.map((c) => {
            const current = categoryWeightFor(settings, c.id);
            return (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">
                    {c.emoji} {c.label}
                  </span>
                  <span className="text-muted-foreground">{SHORT[current]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {WEIGHTS.map((w) => (
                    <MyFloveChip
                      key={w}
                      active={current === w}
                      onClick={() =>
                        !off &&
                        setSettings({
                          ...settings,
                          categoryWeights: { ...settings.categoryWeights, [c.id]: w },
                        })
                      }
                    >
                      {SHORT[w]}
                    </MyFloveChip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setSettings({ ...settings, categoryWeights: {} })}
          className="text-sm text-muted-foreground underline hover:text-ink"
        >
          Återställ alla faktorer till Normalt
        </button>
      </MyFloveCard>
    </div>
  );
}
