import { useEffect } from "react";
import { Link } from "wouter";
import { Smile, Battery } from "lucide-react";
import Layout from "@/components/layout";
import { PacePageHeader } from "@/components/paceable/page-header";
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
import { EnergyFlowContent } from "@/pages/energy-flow";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useLang } from "@/hooks/use-language";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useEnergyPattern } from "@/hooks/use-energy-pattern";
import { Switch } from "@/components/ui/switch";

/**
 * Mitt batteri – lugn översikt över registrerad energi och mående.
 * Registrering sker på Idag; här visas kapacitet, historik och energipåverkan.
 * Samma data som tidigare, bara tydligare ordning.
 * Befintliga formulär och datakällor behåller ägandet över registreringar.
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
      <MyFlovePageGrid area="halsa" className="pace-ds pace-compact-page pace-next-page pace-next-health gap-4">
        <MyFloveWide>
          <PacePageHeader
            title={
              name ? `${name}${lang === "en" ? "'s battery" : "s batteri"}` : t("Mitt batteri")
            }
            icon={Battery}
            description={t("Din energi just nu, tidigare mående och det som påverkar dig.")}
          />
        </MyFloveWide>

        {/* Samma egenregistrerade värde som i Idag och Kalender. */}
        <MyFloveWide>
          <section className="pace-surface rounded-3xl p-4 shadow-soft sm:p-5" data-testid="capacity-summary">
            <h2 className="font-sans text-base font-semibold text-foreground">{t("Just nu")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(capacity.percent === null ? "Ingen energi registrerad ännu. Logga energi & mående på Idag." : "Utifrån din registrering idag och eventuella valfria uppskattningar. Du kan uppdatera den på Idag.")}</p>
            <div className="mt-3 flex justify-center"><SoftEnergyBattery percent={capacity.percent} linked={false} /></div>
            <Button asChild variant="secondary" className="mt-3 min-h-11 w-full whitespace-normal bg-secondary text-secondary-foreground">
              <Link href="/idag">{t("Logga energi & mående")}</Link>
            </Button>
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

        {/* All befintlig fördjupning finns kvar, men visas först efter klick. */}
        <MyFloveWide>
          <CollapsibleSection
            id="battery-more-details"
            defaultCollapsed
            title={t("Historik")}
            description={t("Dina registreringar av mående och energi.")}
            className="pace-surface rounded-3xl p-4 shadow-soft sm:p-5"
            headingClassName="font-sans text-base font-semibold text-ink"
          >

          <div className="space-y-3">
          <Tabs defaultValue="mood" className="w-full" data-testid="battery-history">
            <TabsList className="pace-segmented">
              <TabsTrigger value="mood" className="pace-segment">
                <Smile size={14} className="mr-1" /> {t("Mående")}
              </TabsTrigger>
              <TabsTrigger value="energy" className="pace-segment">
                <Battery size={14} className="mr-1" /> {t("Energi")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mood" className="mt-4">
              <MoodContent showHeader={false} readOnly />
            </TabsContent>
            <TabsContent value="energy" className="mt-4">
              <EnergyContent showHeader={false} readOnly />
            </TabsContent>
          </Tabs>
          </div>
          </CollapsibleSection>
        </MyFloveWide>

        <MyFloveWide>
          <CollapsibleSection
            id="battery-energy-influences"
            title={t("Vad påverkar min energi?")}
            description={t("Aktiviteter och sådant du själv har märkt ger eller tar energi – inte ditt registrerade batterivärde.")}
            defaultCollapsed
            className="border-t border-border/60 pt-3"
            headingClassName="font-sans text-base font-semibold text-ink"
          >
            <EnergyFlowContent showHeader={false} showDayFlow={false} embedded />
            <PatternsCard />
            <CycleCard />
            <DayEdgesCheckin />
          </CollapsibleSection>
        </MyFloveWide>

      </MyFlovePageGrid>
    </Layout>
  );
}
