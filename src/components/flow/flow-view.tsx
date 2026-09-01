import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";
import FlowTabs, { type FlowTab } from "@/components/flow/flow-tabs";
import { FlowPlanContent } from "@/components/flow/flow-plan-content";
import { AssistantContent } from "@/components/flow/assistant-content";

/**
 * En enda Flow-vy: hjälpen, planeringen och chatten är lägen i samma sida.
 * Adresserna /flow, /flowplan och /assistant finns kvar och väljer startläge.
 * URL:en är den enda källan för aktiv flik, så uppdatering och back/forward
 * öppnar samma läge som användaren faktiskt valde.
 */
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
      <FlowTabs active={tab} onChange={changeTab} />
      {tab === "flow" && (
        <MyFlovePageGrid area="flow">
          <MyFloveWide>
            <main className="mx-auto w-full max-w-xl" aria-label="Flow – vad passar bäst just nu">
              <FlowDeck />
            </main>
          </MyFloveWide>
        </MyFlovePageGrid>
      )}
      {tab === "planera" && <FlowPlanContent />}
      {tab === "chatt" && <AssistantContent chatId={chatId} />}
    </Layout>
  );
}
