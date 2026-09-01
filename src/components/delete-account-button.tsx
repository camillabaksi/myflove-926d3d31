import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { clearLocalUserData } from "@/lib/local-data";
import { track } from "@/lib/analytics";

interface Props {
  onDeleted?: () => void;
  size?: "sm" | "default";
  className?: string;
}

export function DeleteAccountButton({ onDeleted, size = "sm", className }: Props) {
  const del = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await del({ data: undefined });
      try {
        await supabase.auth.signOut();
      } catch {
        // ignoreras med flit – felet påverkar inte användaren
      }
      // Kontot är raderat – då finns inget moln att spara till, allt lokalt bort.
      await clearLocalUserData({ force: true });
      track("account_deleted", { result: "completed" });
      onDeleted?.();
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (e) {
      track("account_deletion_cancelled", { result: "error" });
      alert("Kunde inte radera kontot: " + (e as Error).message);
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`rounded-xl gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 ${className ?? ""}`}
        onClick={() => {
          track("account_deletion_started", { source: "installningar" });
          setConfirming(true);
        }}
      >
        <Trash2 size={16} /> Avsluta konto
      </Button>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 ${className ?? ""}`}
    >
      <p className="text-sm text-foreground">
        Är du säker? Detta raderar ditt konto och all data permanent.
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size={size}
          className="rounded-xl gap-2"
          disabled={busy}
          onClick={handleDelete}
        >
          <Trash2 size={16} /> {busy ? "Raderar…" : "Ja, radera"}
        </Button>
        <Button
          variant="ghost"
          size={size}
          className="rounded-xl"
          disabled={busy}
          onClick={() => {
            track("account_deletion_cancelled", { result: "cancelled" });
            setConfirming(false);
          }}
        >
          Avbryt
        </Button>
      </div>
    </div>
  );
}
