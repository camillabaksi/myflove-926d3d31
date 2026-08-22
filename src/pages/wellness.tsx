import { useState } from "react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodContent } from "@/pages/mood";
import { EnergyContent } from "@/pages/energy-map";
import { EnergyFlowContent } from "@/pages/energy-flow";
import { Heart, Smile, Battery, Hand, Zap } from "lucide-react";

import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import StopModal from "@/components/stop-modal";
import { MyFloveBreathing, MyFloveHeart } from "@/components/myflove/motion";

export default function WellnessPage() {
  const [stopOpen, setStopOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <MyFloveHeader
          title="Må bra"
          emojiKey="wellness"
          description="Checka in mående och energi från samma ställe – båda eller var för sig."
        />

        <div className="flex justify-center">
          <MyFloveBreathing size={76} mood="calm">
            <MyFloveHeart size={30} mood="calm" />
          </MyFloveBreathing>
        </div>

        <Button
          onClick={() => setStopOpen(true)}
          className="w-full h-14 rounded-2xl text-lg font-semibold shadow-sm"
        >
          <Hand size={20} className="mr-2" aria-hidden="true" />
          Stop – ta en paus först
        </Button>
        <StopModal open={stopOpen} onOpenChange={setStopOpen} />

        <Tabs defaultValue="both" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-11 rounded-2xl">
            <TabsTrigger value="both" className="rounded-xl text-xs">
              Alla
            </TabsTrigger>
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

          <TabsContent value="both" className="mt-6 space-y-10">
            <CollapsibleSection
              id="mande"
              title={
                <span className="flex items-center gap-2">
                  <Smile size={18} className="text-primary" /> Mående
                </span>
              }
              headingClassName="text-lg font-semibold"
            >
              <MoodContent showHeader={false} />
            </CollapsibleSection>
            <div className="h-px bg-border" />
            <CollapsibleSection
              id="energi"
              title={
                <span className="flex items-center gap-2">
                  <Battery size={18} className="text-primary" /> Energi
                </span>
              }
              headingClassName="text-lg font-semibold"
            >
              <EnergyContent showHeader={false} />
            </CollapsibleSection>
            <div className="h-px bg-border" />
            <CollapsibleSection
              id="energiflode"
              title={
                <span className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" /> Min energi
                </span>
              }
              headingClassName="text-lg font-semibold"
            >
              <EnergyFlowContent showHeader={false} />
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="mood" className="mt-6">
            <MoodContent showHeader={false} />
          </TabsContent>

          <TabsContent value="energy" className="mt-6">
            <EnergyContent showHeader={false} />
          </TabsContent>

          <TabsContent value="flow" className="mt-6">
            <EnergyFlowContent showHeader={false} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
