import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, LineChart, Smile, Battery, Zap } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import EnergyBattery from "@/components/energy-battery";
import SimpleCheckin from "@/components/simple-checkin";
import ImpactCheckin from "@/components/impact-checkin";
import PatternsCard from "@/components/patterns-card";
import CycleCard from "@/components/cycle-card";
import BatteryToday from "@/components/battery-today";
import DayEdgesCheckin from "@/components/day-edges-checkin";
import DayEnergyFlow from "@/components/day-energy-flow";
import CollapsibleSection from "@/components/collapsible-section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodContent } from "@/pages/mood";
import { EnergyContent } from "@/pages/energy-map";
import { EnergyFlowContent } from "@/pages/energy-flow";
import { track } from "@/lib/analytics";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLang } from "@/hooks/use-language";

/**
 * Mitt batteri – den enda platsen för energi och mående.
 * Hierarki: 1) Snabb incheckning, 2) Nuvarande batteri/översikt,
 * 3) Dagens energiflöde, 4) Historik som sekundär funktion längst ner.
 * Samma data som tidigare, bara tydligare ordning.
 * Stop-paus har flyttat till Mer → Stop-paus.
 */
export default function BatteryPage() {
  const { name } = useUserProfile();
  const { t, lang } = useLang();
  useEffect(() => {
    track("battery_opened", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="halsa">
        <MyFloveWide>
          <MyFloveHeader
            area="halsa"
            title={
              name ? `${name}${lang === "en" ? "'s battery" : "s batteri"}` : t("Mitt batteri")
            }
            emojiKey="wellness"
            description={t("Din energi och ditt mående – checka in och se hur dagen brukar se ut.")}
            why={t(
              "Vi frågar för att Flow ska kunna anpassa dagens krav efter hur mycket ork du faktiskt har – inte efter hur mycket du borde ha.",
            )}
          />
        </MyFloveWide>

        {/* 1. En enda primär handling – samma befintliga dataväg. */}
        <MyFloveWide>
          <SimpleCheckin source="mitt-batteri" />
        </MyFloveWide>

        {/* Kort väg till den befintliga historiken – ingen ny vy, ingen ny data. */}
        <MyFloveWide>
          <Link
            href="/historik"
            data-testid="battery-patterns-link"
            onClick={() => track("history_opened", { source: "mitt-batteri" })}
            className="press flex items-center justify-between gap-3 rounded-3xl border-2 border-border/60 bg-card px-4 py-4 shadow-soft hover:border-primary sm:px-5"
          >
            <span className="min-w-0">
              <span className="block font-display text-base font-bold text-ink">
                {t("Vad ger dig energi?")}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t("Se dina mönster – vad som gav och tog energi tidigare dagar.")}
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-primary" />
          </Link>
        </MyFloveWide>

        {/* All befintlig fördjupning finns kvar, men visas först efter klick. */}
        <MyFloveWide>
          <CollapsibleSection
            id="battery-more-details"
            defaultCollapsed
            title={t("Mer om din energi")}
            description={t("Se batteriet, dagens mönster och vad som påverkar dig.")}
            className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
            headingClassName="text-base font-semibold text-ink"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <EnergyBattery />
              <BatteryToday />
              <PatternsCard />
              <CycleCard />
              <DayEdgesCheckin />
              <ImpactCheckin />
              <div className="lg:col-span-2">
                <DayEnergyFlow />
              </div>
            </div>
          </CollapsibleSection>
        </MyFloveWide>

        {/* 4. Historik – sekundär, längst ner. Widget-komprimerad; expanderar i flödet. */}
        <ExpandableBlock
          title={t("Se min historik")}
          titleText={t("Se min historik")}
          subtitle={t("Tidigare mående, energi och energiflöde")}
          icon={LineChart}
          tone="lavender"
          area="halsa"
          widget
          label={t("Historik")}
        >
          <Tabs defaultValue="mood" className="w-full" data-testid="battery-history">
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl">
              <TabsTrigger value="mood" className="rounded-xl text-xs">
                <Smile size={14} className="mr-1" /> {t("Mående")}
              </TabsTrigger>
              <TabsTrigger value="energy" className="rounded-xl text-xs">
                <Battery size={14} className="mr-1" /> {t("Energi")}
              </TabsTrigger>
              <TabsTrigger value="flow" className="rounded-xl text-xs">
                <Zap size={14} className="mr-1" /> {t("Flöde")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mood" className="mt-6">
              <MoodContent showHeader={false} readOnly />
            </TabsContent>
            <TabsContent value="energy" className="mt-6">
              <EnergyContent showHeader={false} />
            </TabsContent>
            <TabsContent value="flow" className="mt-6">
              <EnergyFlowContent showHeader={false} showDayFlow={false} />
            </TabsContent>
          </Tabs>
          <Link
            href="/energifloede"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("Mer om vad som ger och tar energi")} <ArrowRight size={14} />
          </Link>
        </ExpandableBlock>
      </MyFlovePageGrid>
    </Layout>
  );
}
