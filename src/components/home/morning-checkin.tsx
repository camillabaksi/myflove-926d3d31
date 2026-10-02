import { Sun } from "lucide-react";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useLang } from "@/hooks/use-language";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { MORNING_TO_CAPACITY, type MorningAnswer } from "@/lib/tomorrow-prep";

const OPTIONS: { id: MorningAnswer; label: string; dot: string }[] = [
  { id: "energi", label: "Jag har energi", dot: "bg-success" },
  { id: "lagom", label: "Jag har lagom", dot: "bg-warning" },
  { id: "lite", label: "Jag har lite", dot: "bg-destructive" },
  { id: "forsiktigt", label: "Idag får vi ta det väldigt försiktigt", dot: "bg-muted-foreground" },
];

/**
 * Morgonens check-in – känn efter hur det faktiskt känns. Svaret sätter
 * dagens kapacitetsläge (samma källa som FlowPlan redan använder).
 */
export default function MorningCheckin() {
  const { t } = useLang();
  const { chosenToday, setMode } = useCapacityMode();
  const [answeredOn, setAnsweredOn] = useCloudSyncedStorage<string>("myflove-morning-checkin", "");
  const hour = new Date().getHours();
  const today = todayISO();
  if (hour < 4 || hour >= 12 || chosenToday || answeredOn === today) return null;

  const answer = (a: MorningAnswer) => {
    setMode(MORNING_TO_CAPACITY[a]);
    setAnsweredOn(today);
    track("battery_checkin_completed", { source: "morgonstart", method: "morgon-checkin", result: "completed" });
  };

  return (
    <section data-testid="morning-checkin" aria-label={t("God morgon")} className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary">
        <Sun className="h-4 w-4" aria-hidden /> {t("God morgon!")}
      </p>
      <p className="mt-2 font-display text-lg font-bold text-ink">{t("Hur känns det idag?")}</p>
      <div className="mt-3 grid gap-2">
        {OPTIONS.map((o) => (
          <button key={o.id} type="button" onClick={() => answer(o.id)}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-left text-sm font-medium text-ink hover:border-primary/40">
            <span className={`h-3 w-3 shrink-0 rounded-full ${o.dot}`} aria-hidden />
            {t(o.label)}
          </button>
        ))}
      </div>
    </section>
  );
}
