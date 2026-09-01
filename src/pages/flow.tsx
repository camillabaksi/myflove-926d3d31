import { useEffect } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";
import FlowTabs from "@/components/flow/flow-tabs";

/** Flow är den gemensamma ingången till hjälp, planering och chatt. */
export default function FlowPage() {
  useEffect(() => {
    track("flow_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <FlowTabs active="flow" />
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
