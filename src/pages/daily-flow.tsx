import { useRouterState } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { RoutinesContent } from "@/pages/routines";
import { MedicationContent } from "@/pages/medication";
import { CheckCircle2, Pill, Repeat, Sun, Sunrise } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import WakeUpCard from "@/components/wake-up-card";
import WakeUpSettings from "@/components/wake-up-settings";
import PushStatusCard from "@/components/push-status-card";
import RoutinesMedicationToday from "@/components/routines-medication-today";

function MorningContent() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Dagen behöver inte börja perfekt. Kryssa ett steg så vet jag att du är igång.
      </p>
      <WakeUpCard always />
      <PushStatusCard />
      <WakeUpSettings />
    </div>
  );
}

export default function DailyFlowPage() {
  const location = useRouterState({ select: (state) => state.location });
  const reveal = (id: string) => location.hash === id ? location.href : undefined;
  return (
    <Layout>
      <MyFlovePageGrid area="idag">
        <MyFloveWide>
          <div className="space-y-6">
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                <Sun className="text-primary" size={26} />
                <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                  Rutiner &amp; medicin
                </h1>
              </div>
              <p className="text-muted-foreground">
                Morgonstart, dina fasta rutiner och doser. Dagens plan och förslag bor i Idag och
                Pace.
              </p>
            </header>

            <MyFloveBlock
              title="I dag"
              subtitle="Dagens rutiner och doser i samma lista"
              icon={CheckCircle2}
              surface="blush"
            >
              <RoutinesMedicationToday showManageLink={false} />
            </MyFloveBlock>

            <div className="space-y-3">
              <CollapsibleSection
                title={
                  <span className="flex items-center gap-2">
                    <Repeat size={18} className="text-primary" /> Rutiner
                  </span>
                }
                description="Lägg till, ändra eller pausa dina återkommande hållpunkter."
                id="Rutiner"
                revealToken={reveal("Rutiner")}
                defaultCollapsed
                className="pace-card-surface rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:p-5"
                headingClassName="text-lg font-semibold"
              >
                <RoutinesContent showHeader={false} />
              </CollapsibleSection>

              <CollapsibleSection
                title={
                  <span className="flex items-center gap-2">
                    <Pill size={18} className="text-primary" /> Medicin
                  </span>
                }
                description="Hantera mediciner, doser och tider på samma ställe."
                id="Medicin"
                revealToken={reveal("Medicin")}
                defaultCollapsed
                className="pace-card-surface rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:p-5"
                headingClassName="text-lg font-semibold"
              >
                <MedicationContent showHeader={false} />
              </CollapsibleSection>

              <CollapsibleSection
                title={
                  <span className="flex items-center gap-2">
                    <Sunrise size={18} className="text-primary" /> Morgonstart
                  </span>
                }
                description="Ditt lugna stöd för att komma igång med dagen."
                id="Morgonstart"
                revealToken={reveal("Morgonstart")}
                defaultCollapsed
                className="pace-card-surface rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft sm:p-5"
                headingClassName="text-lg font-semibold"
              >
                <MorningContent />
              </CollapsibleSection>
            </div>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
