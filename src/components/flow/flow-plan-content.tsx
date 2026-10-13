import { useState } from "react";
import { CheckCircle2, ListOrdered, Sparkles } from "lucide-react";
import DayAdjust from "@/components/journey/day-adjust";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
import { Button } from "@/components/ui/button";
import { useFlowItems } from "@/hooks/use-flow-items";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { PlaceContextPicker } from "@/components/place-context-picker";
import { useLang } from "@/hooks/use-language";
import { addDaysISO, todayISO } from "@/lib/day";

/** Planera visar den gemensamma dagsplanen. Ingen egen energi- eller sorteringsmodell. */
export function FlowPlanContent() {
  const { t } = useLang();
  const [showTomorrow, setShowTomorrow] = useState(
    () => new URLSearchParams(window.location.search).get("day") === "tomorrow",
  );
  const today = todayISO();
  const isTomorrow = showTomorrow;
  const targetDay = isTomorrow ? addDaysISO(today, 1) : today;
  const { toggleItem } = useFlowItems();
  const plan = useFlowPlan([], targetDay);
  const low = !isTomorrow && plan.mode === "lagt";
  const visible = low ? plan.order.slice(0, 1) : plan.order;

  return (
    <MyFlovePageGrid area="planera">
      <MyFloveWide>
        <MyFloveHeader
          title={t("Planera")}
          emojiKey="flowplan"
          description={t("Se vad som är Nu, Sedan och vad som kan vänta.")}
          titleClassName="text-xl sm:text-2xl"
        />
      </MyFloveWide>

      <MyFloveWide>
        <PlaceContextPicker />
      </MyFloveWide>

      <MyFloveWide>
        <div className="inline-flex rounded-full border border-border/70 bg-card/70 p-1" role="group" aria-label={t("Välj dag")}>
          <Button type="button" size="sm" variant={!isTomorrow ? "secondary" : "ghost"} className="min-h-10 rounded-full px-4" aria-pressed={!isTomorrow} onClick={() => setShowTomorrow(false)}>
            {t("Idag")}
          </Button>
          <Button type="button" size="sm" variant={isTomorrow ? "secondary" : "ghost"} className="min-h-10 rounded-full px-4" aria-pressed={isTomorrow} onClick={() => setShowTomorrow(true)}>
            {t("Imorgon")}
          </Button>
        </div>
      </MyFloveWide>

      <MyFloveBlock
        title={isTomorrow ? t("Morgondagens ordning") : low ? t("Nu") : t("Dagens ordning")}
        subtitle={isTomorrow ? t("Det här är en förhandsplan. Orken kan du känna efter i morgon.") : t(plan.message)}
        icon={ListOrdered}
        tone="lavender"
        surface="lavender"
        area="planera"
        span
      >
        {visible.length === 0 ? (
          <p className="rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
            {isTomorrow ? t("Inget är inplanerat för i morgon ännu.") : t("Det finns inget som väntar just nu.")}
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
                      <p className="break-words text-sm font-medium text-ink">{item.title}</p>
                      {(item.time || entry.reason) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.time ? `${item.time} · ` : ""}{t(entry.reason)}
                        </p>
                      )}
                    </div>
                    {!isTomorrow && item.completable && (
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
        {!isTomorrow && plan.unavailableByPlace.length > 0 && (
          <details className="mt-4 rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              {t("Visa förslag som passar bättre på en annan plats")} ({plan.unavailableByPlace.length})
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {plan.unavailableByPlace.map((item) => <li key={item.id}>{item.title}</li>)}
            </ul>
          </details>
        )}
      </MyFloveBlock>

      {!isTomorrow && !low && plan.waiting.length > 0 && (
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

      {!isTomorrow && !low && (
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