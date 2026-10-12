import { useEffect, useRef, useState } from "react";
import SimpleCheckin from "@/components/simple-checkin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { getDataOwner } from "@/lib/account-scope";
import { ACCOUNT_BOUND_EVENT } from "@/lib/cloud-storage";
import { todayISO } from "@/lib/day";
import { ENERGY_SAVED_EVENT, type EnergySavedDetail } from "@/lib/energy-save-feedback";

/** One host across authenticated routes; a toast invites, never forces, a fresh check-in. */
export default function EnergySaveFeedback() {
  const { toast } = useToast();
  const { t } = useLang();
  const [openOwner, setOpenOwner] = useState<string | null>(null);
  const owner = useRef(getDataOwner());
  const lastToast = useRef<{ dismiss: () => void } | null>(null);

  useEffect(() => {
    const clear = () => {
      lastToast.current?.dismiss();
      lastToast.current = null;
      setOpenOwner(null);
      owner.current = getDataOwner();
    };
    const onAccountChanged = () => {
      if (owner.current !== getDataOwner()) clear();
    };
    const onSaved = (event: Event) => {
      const detail = (event as CustomEvent<EnergySavedDetail>).detail;
      if (!detail?.owner || detail.owner !== getDataOwner()) return;
      owner.current = detail.owner;
      const canUpdate = detail.date === todayISO() && detail.direction !== "neutral";
      lastToast.current = toast({
        title: t("Energipåverkan sparad"),
        description: t(
          canUpdate
            ? detail.direction === "drains"
              ? "Du har loggat något som tog energi. Uppdatera batteriet om din ork har ändrats."
              : "Du har loggat något som gav energi. Uppdatera batteriet om din ork har ändrats."
            : "Sparat i din energihistorik.",
        ),
        duration: canUpdate ? 20_000 : 5_000,
        className: "flex-col items-stretch gap-3 space-x-0 rounded-2xl p-4 pr-8",
        action: canUpdate ? (
          <ToastAction
            altText={t("Uppdatera mitt batteri")}
            className="h-auto min-h-11 w-full whitespace-normal rounded-xl px-3 py-2"
            onClick={() => {
              if (detail.owner !== getDataOwner()) return;
              lastToast.current?.dismiss();
              setOpenOwner(detail.owner);
            }}
          >
            {t("Uppdatera mitt batteri")}
          </ToastAction>
        ) : undefined,
      });
    };
    window.addEventListener(ENERGY_SAVED_EVENT, onSaved);
    window.addEventListener(ACCOUNT_BOUND_EVENT, onAccountChanged);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clear();
    });
    return () => {
      window.removeEventListener(ENERGY_SAVED_EVENT, onSaved);
      window.removeEventListener(ACCOUNT_BOUND_EVENT, onAccountChanged);
      data.subscription.unsubscribe();
      lastToast.current?.dismiss();
    };
  }, [t, toast]);

  return (
    <Dialog
      open={openOwner !== null && openOwner === getDataOwner()}
      onOpenChange={(open) => {
        if (!open) setOpenOwner(null);
      }}
    >
      <DialogContent className="pace-ds h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] max-h-[42rem] w-[calc(100%-1rem)] max-w-md grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-0 pb-0 sm:p-0 sm:pb-0 [&>button]:right-3 [&>button]:top-[calc(0.5rem+env(safe-area-inset-top))] [&>button]:z-10 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("Uppdatera mitt batteri")}</DialogTitle>
          <DialogDescription>{t("Din energi och ditt mående just nu.")}</DialogDescription>
        </DialogHeader>
        <SimpleCheckin
          source="energy-feedback"
          presentation="dialog"
          onCancel={() => setOpenOwner(null)}
          onSaved={() => {
            if (openOwner !== getDataOwner()) return;
            setOpenOwner(null);
            lastToast.current = toast({ description: t("Batteriet är uppdaterat.") });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
