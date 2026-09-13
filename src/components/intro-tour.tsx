import { useEffect, useState } from "react";
import { Brain, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlowMascot } from "@/components/flow-mascot";
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
    navigate({ to: "/hem" });
    if (openQuickflow) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("myflove:quickflow"));
      }, 0);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && finish(false)}>
      <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
        <DialogTitle className="text-2xl font-bold text-ink">Vad snurrar i huvudet?</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Börja med en enda sak. Du behöver inte förstå hela MyFlove nu.
        </DialogDescription>

        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={() => finish(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-ink press"
            aria-label="Hoppa över intro och gå till startsidan"
          >
            <X size={14} />
            Hoppa över
          </button>
        </div>

        <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-lavender/70">
          <FlowMascot size="md" mood="calm" alt="Flow hälsar dig välkommen" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button className="w-full rounded-2xl press" onClick={() => finish(true)}>
            <Brain className="h-4 w-4" aria-hidden /> Skriv en tanke
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => finish(false)}
            className="w-full rounded-2xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-ink press"
          >
            Jag vill titta runt först
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
