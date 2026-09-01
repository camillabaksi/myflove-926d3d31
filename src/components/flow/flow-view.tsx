import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";
import FlowTabs, { type FlowTab } from "@/components/flow/flow-tabs";
import { FlowPlanContent } from "@/pages/flowplan";
import { AssistantContent } from "@/pages/assistant";

/**
 * En enda Flow-vy: hjälpen, planeringen och chatten är lägen i samma sida.
 * Adresserna /flow, /flowplan och /assistant finns kvar och väljer startläge.
 */
export default function FlowView({
  initialTab = "flow",
  chatId,
}: {
  initialTab?: FlowTab;
  chatId?: string;
}) {
  const [tab, setTab] = useState<FlowTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    track("flow_viewed", { source: tab });
  }, [tab]);

  return (
    <Layout>
      <FlowTabs active={tab} onChange={setTab} />
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
