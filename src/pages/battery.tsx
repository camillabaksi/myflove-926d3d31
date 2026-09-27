import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, LineChart, Smile, Battery, Zap, MessageCircle } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { ExpandableBlock } from "@/components/myflove/expandable-block";
import EnergyBattery from "@/components/energy-battery";
import SimpleCheckin from "@/components/simple-checkin";
import OrkSummary from "@/components/home/ork-summary";
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
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useFlowScore } from "@/hooks/use-flowscore";
import { orkWord } from "@/lib/ork-word";

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
  const { reading } = useEnergyBattery();
  const { flow } = useFlowScore();
  const activeFactors = flow.factors.filter((factor) => factor.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 4);
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
            description={t("Hur mycket ork har du idag?")}
          />
        </MyFloveWide>

        <MyFloveWide>
          <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <Battery className="h-6 w-6 text-primary" aria-hidden />
              <h2 className="font-display text-lg font-bold text-ink">Din uppskattade energi: {t(orkWord(reading.now).short)}</h2>
              <CollapsibleSection id="battery-why" title="Varför?" defaultCollapsed className="w-full border-t border-border/60 pt-2" headingClassName="text-sm font-semibold text-primary">
                <p className="text-sm text-muted-foreground">Ungefär {Math.round(reading.now)} %. Det här är en uppskattning, inte en mätning. Kurvan utgår från ditt FlowScore just nu och tar hänsyn till planerade tider och registrerade energipåverkningar. Utan egna mönster används en generell kurva.</p>
                {activeFactors.length > 0 && <><p className="text-xs font-semibold text-ink">Det här påverkar FlowScore just nu:</p><ul className="space-y-1 text-sm text-muted-foreground">{activeFactors.map((factor) => <li key={factor.source + factor.label}>{factor.label}: {factor.reading}</li>)}</ul></>}
                <p className="text-xs text-muted-foreground">Ditt eget val Fullt, Mellan eller Lågt styr dagens plan – inte den uppskattade procentsiffran.</p>
              </CollapsibleSection>
            </div>
          </section>
        </MyFloveWide>

        {/* Dagens val styr planen; den uppskattade kurvan gör det inte. */}
        <MyFloveWide>
          <OrkSummary />
        </MyFloveWide>

        <MyFloveWide>
          <Link href="/assistant" className="flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft"><MessageCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden /><span className="min-w-0 flex-1 text-sm font-semibold text-ink">Prata med Flow om dagens nästa steg</span><ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden /></Link>
        </MyFloveWide>

        <MyFloveWide>
          <CollapsibleSection id="battery-log-energy-mood" title={t("Logga energi & mående")} defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="text-base font-semibold text-ink"><SimpleCheckin source="mitt-batteri" /></CollapsibleSection>
        </MyFloveWide>

        {/* Kort väg till den befintliga historiken – ingen ny vy, ingen ny data. */}
        <MyFloveWide>
          <Link
            href="/historik"
            data-testid="battery-patterns-link"
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
            title={t("Kapacitet & mönster")}
            description={t("Historik som hjälper dig förstå tidigare dagar – den styr inte dagens plan.")}
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
