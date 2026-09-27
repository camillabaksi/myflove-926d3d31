import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowEntry from "@/components/flow/flow-entry";
import FlowTabs, { type FlowTab } from "@/components/flow/flow-tabs";
import { FlowPlanContent } from "@/components/flow/flow-plan-content";
import { AssistantContent } from "@/components/flow/assistant-content";

/**
 * En enda Flow-vy: hjälpen, planeringen och chatten är lägen i samma sida.
 * Adresserna /flow, /flowplan och /assistant finns kvar och väljer startläge.
 * URL:en är den enda källan för aktiv flik, så uppdatering och back/forward
 * öppnar samma läge som användaren faktiskt valt.
 *
 * Ingången är förenklad: en kort fråga med EN tydlig huvudhandling
  * ("Prata med Flow") som leder direkt till samtalet.
 * Mer information och de övriga lägena finns kvar – bakom klick.
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
               <FlowEntry onPlan={() => changeTab("planera")} onChat={() => changeTab("chatt")} />
               <Button
                 variant="outline"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("myflove:quickflow"))}
                 className="mt-4 flex h-auto w-full items-center justify-start gap-3 rounded-2xl px-4 py-3 text-left"
              >
                 <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Brain size={22} strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">QuickFlow</span>
                   <span className="block text-sm text-muted-foreground">Få ut det ur huvudet direkt</span>
                </span>
               </Button>
            </main>
          </MyFloveWide>
        </MyFlovePageGrid>
      )}

      {tab === "planera" && <FlowPlanContent />}
      {tab === "chatt" && <AssistantContent chatId={chatId} />}
    </Layout>
  );
}
