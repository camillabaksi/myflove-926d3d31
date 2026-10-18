import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Smile, Battery, Zap, MessageCircle } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { todayISO } from "@/lib/day";
import SimpleCheckin from "@/components/simple-checkin";
import { SoftEnergyBattery } from "@/components/day/soft-energy-battery";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import ImpactCheckin from "@/components/impact-checkin";
import PatternsCard from "@/components/patterns-card";
import CycleCard from "@/components/cycle-card";

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
import { setCollapsed } from "@/lib/collapse-store";

/**
 * Mitt batteri – den enda platsen för energi och mående.
 * Hierarki: 1) Snabb incheckning, 2) Nuvarande batteri/översikt,
 * 3) Dagens energiflöde, 4) Historik som sekundär funktion längst ner.
 * Samma data som tidigare, bara tydligare ordning.
 * Stop-paus har flyttat till Mer → Stop-paus.
 */
export default function BatteryPage() {
  const { name } = useUserProfile();
  const capacity = useDayCapacity()(todayISO());
  const { t, lang } = useLang();
  const [path] = useLocation();
  const checkinRef = useRef<HTMLDivElement>(null);
  const openCheckin = () => {
    setCollapsed(`${path}::battery-log-energy-mood`, false, true);
    window.requestAnimationFrame(() => {
      checkinRef.current?.scrollIntoView({ block: "start" });
      checkinRef.current?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    track("battery_opened", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="halsa" className="pace-next-page pace-next-health">
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

        {/* Samma egenregistrerade värde som i Idag och Kalender. */}
        <MyFloveWide>
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft" data-testid="capacity-summary">
            <h2 className="font-display text-lg font-bold text-ink">{t("Din kapacitet idag")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(capacity.percent === null ? "Hur börjar du dagen?" : "Utifrån din egen registrering idag. Du kan checka in igen när det ändras.")}</p>
            <div className="mt-3 flex justify-center"><SoftEnergyBattery percent={capacity.percent} linked={false} /></div>
            <Button type="button" variant="outline" className="mt-4 min-h-11 w-full rounded-2xl" onClick={openCheckin}>
              <Heart size={16} aria-hidden />{t(capacity.percent === null ? "Checka in" : "Logga energi & mående")}
            </Button>
          </section>
        </MyFloveWide>

        <MyFloveWide>
          <Link
            href="/assistant"
            className="pace-card-surface flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
          >
            <MessageCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
              Prata med Pace om dagens nästa steg
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </Link>
        </MyFloveWide>

        <MyFloveWide>
          <div
            ref={checkinRef}
            tabIndex={-1}
            aria-label={t("Logga energi & mående")}
            className="scroll-mt-24"
          >
            <CollapsibleSection
              id="battery-log-energy-mood"
              title={t("Logga energi & mående")}
              defaultCollapsed
              className="pace-card-surface rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
              headingClassName="text-base font-semibold text-ink"
            >
              <SimpleCheckin source="mitt-batteri" />
            </CollapsibleSection>
          </div>
        </MyFloveWide>

        <MyFloveWide>
          <DayEdgesCheckin />
        </MyFloveWide>

        {/* All befintlig fördjupning finns kvar, men visas först efter klick. */}
        <MyFloveWide>
          <CollapsibleSection
            id="battery-more-details"
            defaultCollapsed
            title={t("Historik & mönster")}
            description={t("Dina loggningar och en separat beräknad energikurva.")}
            className="pace-card-surface rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
            headingClassName="text-base font-semibold text-ink"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <PatternsCard />
              <CycleCard />
              
              <ImpactCheckin />
              <div className="lg:col-span-2">
                <DayEnergyFlow />
              </div>
            </div>
          <div className="mt-5 border-t border-border/50 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("Tidigare mående och energi")}</h3>
          <Tabs defaultValue="mood" className="w-full" data-testid="battery-history">
            <TabsList className="grid h-11 w-full grid-cols-3 rounded-2xl">
              <TabsTrigger value="mood" className="rounded-xl text-xs">
                <Smile size={14} className="mr-1" /> {t("Mående")}
              </TabsTrigger>
              <TabsTrigger value="energy" className="rounded-xl text-xs">
                <Battery size={14} className="mr-1" /> {t("Energi")}
              </TabsTrigger>
              <TabsTrigger value="flow" className="rounded-xl text-xs">
                <Zap size={14} className="mr-1" /> {t("Energimönster")}
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
          </div>
          </CollapsibleSection>
        </MyFloveWide>

      </MyFlovePageGrid>
    </Layout>
  );
}
