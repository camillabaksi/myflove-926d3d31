import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodContent } from "@/pages/mood";
import { EnergyContent } from "@/pages/energy-map";
import { EnergyFlowContent } from "@/pages/energy-flow";
import { Smile, Battery, Hand, Zap, ArrowRight } from "lucide-react";

import CollapsibleSection from "@/components/collapsible-section";
import StopModal from "@/components/stop-modal";
import SimpleCheckin from "@/components/simple-checkin";
import { track } from "@/lib/analytics";

/**
 * Energi och mående – en enda sak: "Hur är det just nu?".
 * Öppna → ange energi och mående → klart. Allt annat (historik, mönster,
 * energiflöde och paus) ligger kvar men sekundärt, bakom "Se historik".
 * Medicin hör inte hit – den ligger kvar i Rutiner & medicin.
 */
export default function WellnessPage() {
  const [stopOpen, setStopOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Layout>
      <div className="space-y-5">
        <MyFloveHeader
          title="Hur är det just nu?"
          emojiKey="wellness"
          description="Ange energi och mående – sedan är du klar."
        />

        <SimpleCheckin source="ma-bra" />

        {/* Sekundärt: fördjupning och paus – små länkar, inga extra kort. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/mitt-batteri"
            data-testid="battery-cta"
            onClick={() => track("battery_opened", { source: "ma-bra" })}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            Öppna Mitt batteri <ArrowRight size={14} />
          </Link>

          {!showHistory && (
            <button
              type="button"
              data-testid="show-history"
              onClick={() => setShowHistory(true)}
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Se historik
            </button>
          )}

          <button
            type="button"
            onClick={() => setStopOpen(true)}
            className="inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            <Hand size={14} aria-hidden="true" /> Stop – ta en paus först
          </button>
        </div>
        <StopModal open={stopOpen} onOpenChange={setStopOpen} />

        {showHistory && (
          <div data-testid="wellness-history" className="space-y-4">
            <Tabs defaultValue="mood" className="w-full">
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
                <CollapsibleSection
                  id="mande"
                  title="Mående över tid"
                  headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <MoodContent showHeader={false} />
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="energy" className="mt-6">
                <EnergyContent showHeader={false} />
              </TabsContent>

              <TabsContent value="flow" className="mt-6">
                <EnergyFlowContent showHeader={false} />
              </TabsContent>
            </Tabs>

            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Dölj historiken
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
