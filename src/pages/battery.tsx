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
            title={name ? `${name}${lang === "en" ? "'s battery" : "s batteri"}` : t("Mitt batteri")}
            emojiKey="wellness"
            description={t("Din energi och ditt mående – checka in och se hur dagen brukar se ut.")}
            why={t("Vi frågar för att Flow ska kunna anpassa dagens krav efter hur mycket ork du faktiskt har – inte efter hur mycket du borde ha.")}
          />
        </MyFloveWide>

        {/* 1. Primär incheckning + nu-läge – samma befintliga dataväg */}
        <MyFloveWide className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <SimpleCheckin source="mitt-batteri" />
          <EnergyBattery defaultOpen />
        </MyFloveWide>

        {/* 2. Påverkan + dagens tidsstämplade observationer */}
        <MyFloveWide className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <ImpactCheckin />
          <BatteryToday />
        </MyFloveWide>

        {/* 2c. Mina mönster – valfritt, hopfällt som standard */}
        <MyFloveWide>
          <PatternsCard />
        </MyFloveWide>

        {/* 2b. Menscykel – visas bara om användaren själv aktiverat den */}
        <MyFloveWide className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <CycleCard />
        </MyFloveWide>

        {/* 3. Morgon/kväll */}
        <MyFloveWide className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <DayEdgesCheckin />
        </MyFloveWide>

        {/* 3. Dagens energiflöde – graf, hela bredden */}
        <MyFloveWide>
          <DayEnergyFlow />
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
