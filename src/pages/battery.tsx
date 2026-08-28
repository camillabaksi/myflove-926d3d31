import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, LineChart, Smile, Battery, Zap } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import EnergyBattery from "@/components/energy-battery";
import SimpleCheckin from "@/components/simple-checkin";
import DayEdgesCheckin from "@/components/day-edges-checkin";
import DayEnergyFlow from "@/components/day-energy-flow";
import CollapsibleSection from "@/components/collapsible-section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodContent } from "@/pages/mood";
import { EnergyContent } from "@/pages/energy-map";
import { EnergyFlowContent } from "@/pages/energy-flow";
import { track } from "@/lib/analytics";

/**
 * Mitt batteri – den enda platsen för energi och mående.
 * Hierarki: 1) Snabb incheckning, 2) Nuvarande batteri/översikt,
 * 3) Dagens energiflöde, 4) Historik som sekundär funktion längst ner.
 * Samma data som tidigare, bara tydligare ordning.
 * Stop-paus har flyttat till Mer → Stop-paus.
 */
export default function BatteryPage() {
  useEffect(() => {
    track("battery_opened", { source: "sida" });
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <MyFloveHeader
          title="Mitt batteri"
          emojiKey="wellness"
          description="Din energi och ditt mående – checka in och se hur dagen brukar se ut."
        />

        {/* 1. Primär incheckning */}
        <SimpleCheckin source="mitt-batteri" />

        {/* 2. Nuvarande batteri och dagskurva */}
        <EnergyBattery defaultOpen />

        {/* 3. Morgon/kväll och dagens energiflöde */}
        <DayEdgesCheckin />
        <DayEnergyFlow />


        {/* 4. Historik – sekundär, längst ner */}
        <section
          aria-label="Se min historik"
          className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
        >
          <CollapsibleSection
            id="batteri::historik"
            title={
              <span className="flex items-center gap-2">
                <LineChart size={18} className="text-primary" aria-hidden="true" /> Se min historik
              </span>
            }
            headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            className="space-y-4"
          >
            <Tabs defaultValue="mood" className="w-full" data-testid="battery-history">
              <TabsList className="grid w-full grid-cols-3 h-11 rounded-2xl">
                <TabsTrigger value="mood" className="rounded-xl text-xs">
                  <Smile size={14} className="mr-1" /> Mående
                </TabsTrigger>
                <TabsTrigger value="energy" className="rounded-xl text-xs">
                  <Battery size={14} className="mr-1" /> Energi
                </TabsTrigger>
                <TabsTrigger value="flow" className="rounded-xl text-xs">
                  <Zap size={14} className="mr-1" /> Flöde
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mood" className="mt-6">
                <MoodContent showHeader={false} />
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
              Mer om vad som ger och tar energi <ArrowRight size={14} />
            </Link>
          </CollapsibleSection>
        </section>
      </div>
    </Layout>
  );
}
