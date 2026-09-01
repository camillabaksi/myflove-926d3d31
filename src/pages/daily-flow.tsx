import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoutinesContent } from "@/pages/routines";
import { MedicationContent } from "@/pages/medication";
import { Sun, Repeat, Pill, Sunrise } from "lucide-react";
import CollapsibleSection from "@/components/collapsible-section";
import WakeUpCard from "@/components/wake-up-card";
import WakeUpSettings from "@/components/wake-up-settings";

function MorningContent() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Dagen behöver inte börja perfekt. Kryssa ett steg så vet jag att du är igång.
      </p>
      <WakeUpCard always />
      <WakeUpSettings />
    </div>
  );
}

export default function DailyFlowPage() {
  return (
    <Layout>
      <MyFlovePageGrid area="idag">
        <MyFloveWide>
          <div className="space-y-6">
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                <Sun className="text-primary" size={26} />
                <h1 className="text-3xl font-bold">Rutiner &amp; medicin</h1>
              </div>
              <p className="text-muted-foreground">
                Morgonstart, dina fasta rutiner och doser. Dagens plan och förslag bor i Idag och
                Flow.
              </p>
            </header>

            <Tabs defaultValue="both" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-1 rounded-2xl">
                <TabsTrigger value="both" className="rounded-xl">
                  Alla
                </TabsTrigger>
                <TabsTrigger value="morgon" className="rounded-xl">
                  <Sunrise size={14} className="mr-1.5" /> Morgon
                </TabsTrigger>
                <TabsTrigger value="rutiner" className="rounded-xl">
                  <Repeat size={14} className="mr-1.5" /> Rutiner
                </TabsTrigger>
                <TabsTrigger value="medicin" className="rounded-xl">
                  <Pill size={14} className="mr-1.5" /> Medicin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="both" className="mt-6 space-y-10">
                <CollapsibleSection
                  title={
                    <span className="flex items-center gap-2">
                      <Sunrise size={18} className="text-primary" /> Morgonstart
                    </span>
                  }
                  id="Morgonstart"
                  headingClassName="text-lg font-semibold"
                >
                  <MorningContent />
                </CollapsibleSection>
                <div className="h-px bg-border" />
                <CollapsibleSection
                  title={
                    <span className="flex items-center gap-2">
                      <Repeat size={18} className="text-primary" /> Rutiner
                    </span>
                  }
                  id="Rutiner"
                  headingClassName="text-lg font-semibold"
                >
                  <RoutinesContent showHeader={false} />
                </CollapsibleSection>
                <div className="h-px bg-border" />
                <CollapsibleSection
                  title={
                    <span className="flex items-center gap-2">
                      <Pill size={18} className="text-primary" /> Medicin
                    </span>
                  }
                  id="Medicin"
                  headingClassName="text-lg font-semibold"
                >
                  <MedicationContent showHeader={false} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="morgon" className="mt-6">
                <MorningContent />
              </TabsContent>

              <TabsContent value="rutiner" className="mt-6">
                <RoutinesContent showHeader={false} />
              </TabsContent>

              <TabsContent value="medicin" className="mt-6">
                <MedicationContent showHeader={false} />
              </TabsContent>
            </Tabs>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
