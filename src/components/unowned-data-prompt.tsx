import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_BOUND_EVENT,
} from "@/lib/cloud-storage";
import {
  claimUnownedStash,
  discardUnownedStash,
  getDataOwner,
  unownedStashCount,
} from "@/lib/account-scope";

/**
 * Äldre data på enheten som inte gick att knyta till ett konto visas aldrig
 * automatiskt. Här får den inloggade användaren själv avgöra om den är hens.
 */
export function UnownedDataPrompt() {
  const [count, setCount] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    const check = () => setCount(getDataOwner() ? unownedStashCount() : 0);
    check();
    window.addEventListener(ACCOUNT_BOUND_EVENT, check);
    return () => window.removeEventListener(ACCOUNT_BOUND_EVENT, check);
  }, []);

  if (count === 0) return null;

  return (
    <div className="mx-4 mt-2 rounded-3xl border border-border bg-card p-4 shadow-sm" data-testid="unowned-data-prompt">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <Archive className="h-4 w-4 text-primary" aria-hidden /> Sparade uppgifter från tidigare
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {confirmDiscard
          ? "Uppgifterna tas bort från den här enheten. Det går inte att ångra."
          : "Den här enheten har uppgifter från en äldre version som inte är kopplade till något konto. Är de dina? Inget av ditt nuvarande skrivs över."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {confirmDiscard ? (
          <>
            <Button size="sm" variant="destructive" onClick={() => { discardUnownedStash(); setCount(0); }}>
              Ja, ta bort
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(false)}>
              Tillbaka
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => { claimUnownedStash(); window.location.reload(); }}>
              Ja, lägg till i mitt konto
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(true)}>
              Nej, inte mina
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
