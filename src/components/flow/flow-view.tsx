import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowTabs, { type FlowTab } from "@/components/flow/flow-tabs";
import { FlowPlanContent } from "@/components/flow/flow-plan-content";
import { AssistantContent } from "@/components/flow/assistant-content";
import { ArrowLeft, MessageCircle } from "lucide-react";

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
      <div className={(tab === "chatt" || tab === "flow") && !chatId ? "pace-scene" : undefined}>
      {(tab === "chatt" || tab === "flow") && !chatId && (
        <>
        <div className="pace-scene-actions"><button type="button" aria-label="Tillbaka till Idag" onClick={() => void navigate({ to: "/idag" })}><ArrowLeft size={22} /></button><button type="button" aria-label="Skriv till Pace" onClick={() => document.getElementById("pace-chat-input")?.focus()}><MessageCircle size={22} /></button></div>
        <section className="pace-welcome-hero" aria-label="Pace, din följeslagare">
          <div className="pace-welcome-copy">
            <h1>Pace</h1>
            <p className="pace-welcome-subtitle">Din följeslagare i vardagen</p>
            <p className="pace-welcome-description">Här kan du få stöd, samla tankar, planera och hitta lite mer utrymme i vardagen.</p>
          </div>
        </section>
        </>
      )}
      <div className="pace-scene-body">
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
      </div>
      </div>
    </Layout>
  );
}
