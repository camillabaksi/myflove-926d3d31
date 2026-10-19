import { useEffect } from "react";
import { Smile, Battery, Zap } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { todayISO } from "@/lib/day";
import { SoftEnergyBattery } from "@/components/day/soft-energy-battery";
import PatternsCard from "@/components/patterns-card";
import CycleCard from "@/components/cycle-card";

import DayEdgesCheckin from "@/components/day-edges-checkin";
import CollapsibleSection from "@/components/collapsible-section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodContent } from "@/pages/mood";
import { EnergyContent } from "@/pages/energy-map";
import { EnergyFlowInsights } from "@/pages/energy-flow";
import { track } from "@/lib/analytics";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLang } from "@/hooks/use-language";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { Switch } from "@/components/ui/switch";

/**
 * Mitt batteri – lugn översikt över registrerad energi och mående.
 * Registrering sker på Idag; här visas kapacitet, energiresa och historik.
 * Samma data som tidigare, bara tydligare ordning.
 * Stop-paus har flyttat till Mer → Stop-paus.
 */
export default function BatteryPage() {
  const { name } = useUserProfile();
  const capacity = useDayCapacity()(todayISO());
  const { t, lang } = useLang();
  const [followRhythm, setFollowRhythm] = useCloudSyncedStorage<boolean>("paceable-follow-energy-rhythm", false);
  const { pattern } = useEnergyPattern();
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
          <section className="pace-surface rounded-3xl p-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:p-5" data-testid="capacity-summary">
            <h2 className="font-sans text-[22px] font-semibold text-ink">{t("Din kapacitet idag")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(capacity.percent === null ? "Ingen energi registrerad ännu. Logga energi & mående på Idag." : "Utifrån din registrering idag och eventuella valfria uppskattningar. Du kan uppdatera den på Idag.")}</p>
            <div className="mt-3 flex justify-center"><SoftEnergyBattery percent={capacity.percent} linked={false} /></div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 p-3">
              <div className="min-w-0">
                <label htmlFor="follow-energy-rhythm" className="text-sm font-semibold text-ink">Följ min energirytm</label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Frivillig, försiktig uppskattning utifrån dina egna energiloggar. Högst 6 procentenheters minskning sedan senaste incheckningen. Din registrering ändras aldrig.</p>
                {!pattern.reliable && <p className="mt-1 text-xs text-muted-foreground">Behöver minst 8 energiloggar för att kunna användas.</p>}
              </div>
              <Switch id="follow-energy-rhythm" checked={followRhythm} onCheckedChange={setFollowRhythm} aria-label="Följ min energirytm" />
            </div>
            {followRhythm && <p className="mt-2 text-xs text-muted-foreground">Visad energi kan innehålla en liten uppskattad förändring över dagen. Det är inte en mätning. En ny incheckning väger alltid tyngst.</p>}
          </section>
        </MyFloveWide>

        <MyFloveWide>
          <DayEdgesCheckin />
        </MyFloveWide>

        {/* All befintlig fördjupning finns kvar, men visas först efter klick. */}
        <MyFloveWide>
          <CollapsibleSection
            id="battery-more-details"
            defaultCollapsed
            title={t("Historik & insikter")}
            description={t("Tidigare registreringar och mönster, utan nya formulär.")}
            className="pace-surface rounded-3xl p-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:p-5"
            headingClassName="font-sans text-base font-semibold text-ink"
          >

          <div className="space-y-3">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("Tidigare mående och energi")}</h3>
          <Tabs defaultValue="mood" className="w-full" data-testid="battery-history">
            <TabsList className="grid h-10 w-full grid-cols-3 rounded-2xl bg-[#F5EDF7]/60">
              <TabsTrigger value="mood" className="rounded-xl text-xs font-medium">
                <Smile size={14} className="mr-1" /> {t("Mående")}
              </TabsTrigger>
              <TabsTrigger value="energy" className="rounded-xl text-xs">
                <Battery size={14} className="mr-1" /> {t("Energi")}
              </TabsTrigger>
              <TabsTrigger value="flow" className="rounded-xl text-xs">
                <Zap size={14} className="mr-1" /> {t("Mönster")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mood" className="mt-6">
              <MoodContent showHeader={false} readOnly />
            </TabsContent>
            <TabsContent value="energy" className="mt-6">
              <EnergyContent showHeader={false} readOnly />
            </TabsContent>
            <TabsContent value="flow" className="mt-6">
              <EnergyFlowInsights />
            </TabsContent>
          </Tabs>
          <PatternsCard />
          <CycleCard />
          </div>
          </CollapsibleSection>
        </MyFloveWide>

      </MyFlovePageGrid>
    </Layout>
  );
}
