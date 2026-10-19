import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowTabs, { type FlowTab } from "@/components/flow/flow-tabs";
import { FlowPlanContent } from "@/components/flow/flow-plan-content";
import { AssistantContent } from "@/components/flow/assistant-content";
import { PaceableStones } from "@/components/paceable/paceable-stones";

/** /flow visar Flow-chatten; Min Flow är tillfälligt borttagen. */
export default function FlowView({
  initialTab = "flow",
  chatId,
}: {
  initialTab?: FlowTab;
  chatId?: string;
}) {
  const navigate = useNavigate();
  const tab = initialTab;

  useEffect(() => {
    track("flow_viewed", { source: tab });
  }, [tab]);

  const changeTab = (next: FlowTab) => {
    const paths: Record<FlowTab, "/flow" | "/flowplan" | "/assistant"> = {
      flow: "/flow",
      planera: "/flowplan",
      chatt: "/assistant",
    };
    void navigate({ to: paths[next] });
  };

  return (
    <Layout>
      {(tab === "chatt" || tab === "flow") && !chatId && (
        <section className="pace-welcome-hero" aria-label="Pace, din följeslagare">
          <div className="pace-welcome-copy">
            <h1>Pace</h1>
            <p className="pace-welcome-subtitle">Din följeslagare i vardagen</p>
            <p className="pace-welcome-description">Här kan du få stöd, samla tankar, planera och hitta lite mer utrymme i vardagen.</p>
          </div>
          <PaceableStones tactile className="pace-welcome-stones" />
        </section>
      )}
      <FlowTabs active={tab === "flow" ? "chatt" : tab} onChange={changeTab} />
      {tab === "flow" && (
        <MyFlovePageGrid area="flow">
          <MyFloveWide>
            <AssistantContent chatId={chatId} />
          </MyFloveWide>
        </MyFlovePageGrid>
      )}

      {tab === "planera" && <FlowPlanContent />}
      {tab === "chatt" && <AssistantContent chatId={chatId} />}
    </Layout>
  );
}
