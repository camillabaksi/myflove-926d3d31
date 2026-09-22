import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import StopModal from "@/components/stop-modal";
import EnergyAfterCheck from "@/components/recovery/energy-after-check";

import { useSmartBack } from "@/hooks/use-smart-back";
import { track } from "@/lib/analytics";

/**
 * Stop-paus – en egen sida under Mer.
 * Samma funktion och logik som tidigare (StopModal), bara en egen plats.
 * Stängs → tillbaka via routerhistoriken.
 */
export default function StopPausPage() {
  const [open, setOpen] = useState(true);
  const [check, setCheck] = useState(false);
  const goBack = useSmartBack("/hem");

  // Räknas oavsett om Stopp-knappen öppnas från Återhämtning eller direkt.
  useEffect(() => {
    track("recovery_stop_opened");
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="halsa">
        <MyFloveWide>
          <div className="space-y-6">
            <MyFloveHeader
              area="aterhamtning"
              title="Stop-paus"
              emojiKey="wellness"
              description="En paus mellan impuls och beslut – andas, sätt ord, välj."
            />
            {check && (
              <EnergyAfterCheck
                title="Stopp-knappen"
                source="stop_paus"
                onDone={() => {
                  setCheck(false);
                  goBack();
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft"
            >
              <Hand size={16} aria-hidden="true" /> Öppna Stop-paus
            </button>
            <StopModal
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                // Efter en stop-paus: samma frivilliga energikoll som efter Paus/Ljusboost.
                if (!next) setCheck(true);
              }}
            />
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
