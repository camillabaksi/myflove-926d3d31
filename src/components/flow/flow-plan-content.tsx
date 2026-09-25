import { CheckCircle2, ListOrdered, Sparkles } from "lucide-react";
import CapacitySelector from "@/components/capacity-selector";
import DayAdjust from "@/components/journey/day-adjust";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
import { Button } from "@/components/ui/button";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { useLang } from "@/hooks/use-language";

/** Planera visar den gemensamma dagsplanen. Ingen egen energi- eller sorteringsmodell. */
export function FlowPlanContent() {
  const { t } = useLang();
  const { toggleItem } = useFlowItems();
  const plan = useFlowPlan();
  const low = plan.mode === "lagt";
  const visible = low ? plan.order.slice(0, 1) : plan.order;

  return (
    <MyFlovePageGrid area="planera">
      <MyFloveWide>
        <MyFloveHeader
          title={t("Planera")}
          emojiKey="flowplan"
          description={t("Se vad som är Nu, Sedan och vad som kan vänta.")}
        />
      </MyFloveWide>

      <MyFloveWide>
        <CapacitySelector />
      </MyFloveWide>

      <MyFloveBlock
        title={low ? t("Nu") : t("Dagens ordning")}
        subtitle={t(plan.message)}
        icon={ListOrdered}
        tone="lavender"
        surface="lavender"
        area="planera"
        span
      >
        {visible.length === 0 ? (
          <p className="rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
            {t("Det finns inget som väntar just nu.")}
          </p>
        ) : (
          <ol className="space-y-3">
            {visible.map((entry, index) => {
              const item = entry.item.flowItem;
              const label = index === 0 ? t("Nu") : index === 1 ? t("Sedan") : t("Därefter");
              return (
                <li key={item.id} className="rounded-2xl border border-border/60 bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-primary">{label}</p>
                  <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-ink">{item.title}</p>
                      {(item.time || entry.reason) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.time ? `${item.time} · ` : ""}{t(entry.reason)}
                        </p>
                      )}
                    </div>
                    {item.completable && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleItem(item)}
                        className="shrink-0 rounded-full"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> {t("Klar")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </MyFloveBlock>

      {!low && plan.waiting.length > 0 && (
        <MyFloveBlock
          title={t("Kan vänta")}
          subtitle={t("Det här ligger kvar, men behöver inte ta plats i dagens plan.")}
          icon={Sparkles}
          tone="sky"
          surface="sky"
          area="planera"
          span
          collapsible
          collapseId="planering::kan-vanta"
          defaultCollapsed
        >
          <ul className="space-y-2 text-sm text-muted-foreground">
            {plan.waiting.map((entry) => <li key={entry.item.id}>{entry.item.title}</li>)}
          </ul>
        </MyFloveBlock>
      )}

      {!low && (
        <MyFloveBlock
          title={t("Behöver du planera om?")}
          subtitle={t("Flytta, förenkla eller dela upp – inget händer förrän du säger ja")}
          icon={Sparkles}
          tone="mint"
          surface="mint"
          area="planera"
          span
          collapsible
          collapseId="planering::steg-planera-om"
          defaultCollapsed
        >
          <DayAdjust />
        </MyFloveBlock>
      )}
    </MyFlovePageGrid>
  );
}