import { useEffect } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";

/**
 * Flow – en enda state-baserad upplevelse.
 * Planering, dagsöversikt och chatt finns kvar på sina ordinarie platser;
 * denna route visar endast den aktiva Flow-vyn.
 */
export default function FlowPage() {
  useEffect(() => {
    track("flow_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="flow">
        <MyFloveWide>
          <main className="mx-auto w-full max-w-xl" aria-label="Flow – vad passar bäst just nu">
            <FlowDeck />
          </main>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
