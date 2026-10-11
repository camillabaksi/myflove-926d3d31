import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks } from "@/hooks/use-data";
import { buildPreparationPlan, detectPreparationIntent } from "@/lib/insight";
import { useLang } from "@/hooks/use-language";

function dateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10) as string;
}

/**
 * Quickflow-integration för MyFlove Insight.
 * Känns tanken som en förberedelse-situation föreslår vi en plan – aldrig automatiskt.
 */
export function InsightQuickflowHint() {
  const { t } = useLang();
  const { openItems, absorb } = useQuickflow();
  const { addTask } = useTasks();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [planFor, setPlanFor] = useState<string | null>(null);

  const candidate = useMemo(
    () =>
      openItems.find((i) => !dismissed.includes(i.id) && detectPreparationIntent(i.text) !== null),
    [openItems, dismissed],
  );

  if (!candidate) return null;

  const label = detectPreparationIntent(candidate.text)?.anchorLabel ?? t("det som kommer");
  const plan = buildPreparationPlan(label);

  const createPlan = () => {
    // Om 3 dagar framåt: förberedelsen landar som uppgifter i MyFlow/kalendern.
    for (const step of plan) {
      addTask(step.text, dateStr(step.offsetDays + 2), {
        kind: "uppgift",
        time: step.when,
        reminderMinutesBefore: 0,
      });
    }
    absorb(candidate.text);
    setPlanFor(null);
    toast.success(t("Planen ligger i Paceable 💙"), {
      description: t("Du kan ändra tider eller ta bort stegen när du vill."),
    });
  };

  return (
    <div className="p-5 rounded-3xl border-2 border-primary/30 bg-primary/5 space-y-3">
      <div className="flex items-start gap-3">
        <Sparkles size={18} className="text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">"{candidate.text}"</p>
          <p className="font-medium">
            {t("Det här verkar vara kopplat till en strategi för förberedelse.")}
          </p>
        </div>
        <button
          aria-label={t("Inte nu")}
          onClick={() => setDismissed((d) => [...d, candidate.id])}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {planFor === candidate.id ? (
        <div className="space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan.map((p, i) => (
              <li key={i}>
                {p.offsetDays === -2
                  ? t("2 dagar innan")
                  : p.offsetDays === -1
                    ? t("Kvällen innan")
                    : t("Samma dag")}{" "}
                · {p.when} – {p.text}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button className="rounded-full" onClick={createPlan}>
              {t("Ja, lägg till")}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => setPlanFor(null)}>
              {t("Nej tack")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => setPlanFor(candidate.id)}
        >
          {t("Skapa plan")}
        </Button>
      )}
    </div>
  );
}

export default InsightQuickflowHint;
