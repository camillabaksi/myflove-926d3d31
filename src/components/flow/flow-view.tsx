import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { track } from "@/lib/analytics";
import FlowDeck from "@/components/flow/flow-deck";
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
 * Förstagångsvyn är förenklad: en kort fråga med EN tydlig huvudhandling
 * ("Visa mitt förslag"). Hjälpkarusellen, mer information och de övriga
 * lägena finns kvar – bakom klick.
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
  const [deckOpen, setDeckOpen] = useState(false);

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
              {deckOpen ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDeckOpen(false)}
                    className="press mb-2 -ml-2 gap-1.5 rounded-2xl text-sm text-muted-foreground"
                  >
                    <ChevronLeft size={16} aria-hidden />
                    Tillbaka
                  </Button>
                  <FlowDeck />
                </>
              ) : (
                <FlowEntry
                  onOpen={() => setDeckOpen(true)}
                  onPlan={() => changeTab("planera")}
                  onChat={() => changeTab("chatt")}
                />
              )}
            </main>
          </MyFloveWide>
        </MyFlovePageGrid>
      )}
      {tab === "planera" && <FlowPlanContent />}
      {tab === "chatt" && <AssistantContent chatId={chatId} />}
    </Layout>
  );
}
