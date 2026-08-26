import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, LineChart } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import EnergyBattery from "@/components/energy-battery";
import SimpleCheckin from "@/components/simple-checkin";
import DayEnergyFlow from "@/components/day-energy-flow";
import CollapsibleSection from "@/components/collapsible-section";
import { track } from "@/lib/analytics";

/**
 * Mitt batteri – en egen, lugn vy.
 * Samma data som på Hem (useEnergyBattery + dagens incheckning), ingen ny modell.
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
          description="Din energi just nu – och hur dagen brukar se ut."
        />

        <EnergyBattery defaultOpen />

        <SimpleCheckin source="mitt-batteri" />

        <DayEdgesCheckin />

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
            className="space-y-3"
          >
            <DayEnergyFlow className="border-0 bg-transparent p-0 shadow-none" showHeader={false} />
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
