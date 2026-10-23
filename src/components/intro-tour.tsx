import { BrandLogo } from "@/components/paceable/brand-logo";
import { useEffect, useState } from "react";
import { Feather, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaceableStones } from "@/components/paceable/paceable-stones";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isDemoSession } from "@/lib/demo-account";

/** En enda första handling. Resten upptäcks i appen när användaren behöver det. */
export default function IntroTour() {
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useCloudSyncedStorage<boolean>("myflove-intro-seen", false);
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  if (!mounted || seen || isDemoSession()) return null;

  const finish = (openQuickflow = false) => {
    setSeen(true);
    navigate({ to: "/idag" });
    if (openQuickflow) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("myflove:quickflow"));
      }, 0);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && finish(false)}>
      {/* Hoppa över ligger i flödet (inte ovanpå loggan) och knapparna är fästa i
          dialogens botten, så båda nås även vid stor text när innehållet scrollar.
          Standardkrysset döljs eftersom Hoppa över gör samma sak. */}
      <DialogContent className="max-w-sm gap-3 rounded-3xl p-6 pb-0 text-center sm:pb-0 [&>button:last-child]:hidden">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => finish(false)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-ink press"
            aria-label="Hoppa över intro och gå till startsidan"
          >
            <X size={14} aria-hidden />
            Hoppa över
          </button>
        </div>
        <BrandLogo compact className="pace-app-brand mx-auto" />
        <DialogTitle className="text-2xl font-bold text-ink">Vad snurrar i huvudet?</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Börja med en enda sak. Du behöver inte förstå hela Paceable nu.
        </DialogDescription>

        <div className="mx-auto flex min-h-20 items-center justify-center" aria-hidden="true">
          <PaceableStones tactile compact className="h-20 w-36" />
        </div>

        <div className="sticky bottom-0 -mx-6 flex flex-col items-center gap-2 bg-background px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">
          <Button className="h-auto min-h-11 w-full whitespace-normal rounded-2xl press" onClick={() => finish(true)}>
            <Feather className="h-4 w-4" aria-hidden /> Skriv en tanke
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => finish(false)}
            className="h-auto min-h-11 w-full whitespace-normal rounded-2xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-ink press"
          >
            Jag vill titta runt först
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
