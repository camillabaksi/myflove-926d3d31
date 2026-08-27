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
import { Button } from "@/components/ui/button";
import StopModal from "@/components/stop-modal";
import SimpleCheckin from "@/components/simple-checkin";
import { MyFloveBreathing, MyFloveHeart } from "@/components/myflove/motion";
import { track } from "@/lib/analytics";

/**
 * Energi och mående – en snabb mänsklig incheckning först.
 * Allt avancerat (historik, mönster, energiflöde) ligger kvar men bakom
 * "Se min historik", så första vyn har så få val som möjligt.
 * Medicin hör inte hit – den ligger kvar i Rutiner & medicin.
 */
export default function WellnessPage() {
  const [stopOpen, setStopOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <MyFloveHeader
          title="Energi och mående"
          emojiKey="wellness"
          description="En snabb incheckning – det tar några sekunder."
        />

        <div className="flex justify-center">
          <MyFloveBreathing size={76} mood="calm">
            <MyFloveHeart size={30} mood="calm" />
          </MyFloveBreathing>
        </div>

        <SimpleCheckin source="ma-bra" />

        <Link
          href="/mitt-batteri"
          data-testid="battery-cta"
          onClick={() => track("battery_opened", { source: "ma-bra" })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Öppna Mitt batteri <ArrowRight size={14} />
        </Link>

        <Button
          onClick={() => setStopOpen(true)}
          variant="outline"
          className="w-full h-12 rounded-2xl font-medium"
        >
          <Hand size={18} className="mr-2" aria-hidden="true" />
          Stop – ta en paus först
        </Button>
        <StopModal open={stopOpen} onOpenChange={setStopOpen} />

        {!showHistory ? (
          <button
            type="button"
            data-testid="show-history"
            onClick={() => setShowHistory(true)}
            className="w-full rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          >
            Se min historik
          </button>
        ) : (
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
