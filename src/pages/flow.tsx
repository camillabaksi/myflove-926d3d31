import { useEffect } from "react";
import Layout from "@/components/layout";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";

/**
 * Flow – en enda state-baserad upplevelse.
 * Planering, dagsöversikt och chatt finns kvar på sina ordinarie platser;
 * denna route visar endast den aktiva Flow-vyn.
 */
export default function FlowPage() {
  useEffect(() => {
    track("flow_opened", { source: "sida" });
  }, []);

  return (
    <Layout>
      <main className="mx-auto w-full max-w-xl" aria-label="Flow – vad passar bäst just nu">
        <FlowDeck />
      </main>
    </Layout>
  );
}
