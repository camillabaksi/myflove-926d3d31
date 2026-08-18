import { useMemo, useState } from "react";
import { EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/storage";
import { HOME_SECTIONS, useHiddenHomeSections } from "@/lib/home-sections";
import { SECTION_FOR_HOME_BLOCK, daysSinceFirstUse, daysSinceUsed } from "@/lib/usage-local";

const QUIET_DAYS = 21;
const MIN_APP_DAYS = 14;

/**
 * Ett lugnt förslag, inte en tillsägelse: block du inte öppnat på länge kan
 * döljas så hemskärmen blir kortare. Allt går att slå på igen.
 */
export default function UnusedBlocksHint() {
  const { isHidden, toggle } = useHiddenHomeSections();
  const [dismissedUntil, setDismissedUntil] = useLocalStorage<number>(
    "myflove-unused-hint-dismissed",
    0,
  );
  const [handled, setHandled] = useState<string[]>([]);

  const candidate = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (Date.now() < dismissedUntil) return null;
    if (daysSinceFirstUse() < MIN_APP_DAYS) return null;

    for (const block of HOME_SECTIONS) {
      if (isHidden(block.id) || handled.includes(block.id)) continue;
      const section = SECTION_FOR_HOME_BLOCK[block.id];
      if (!section) continue;
      const days = daysSinceUsed(section);
      if (days !== null && days >= QUIET_DAYS) return { block, days };
    }
    return null;
  }, [dismissedUntil, handled, isHidden]);

  if (!candidate) return null;

  const snooze = () => setDismissedUntil(Date.now() + 30 * 86400000);

  const hide = () => {
    toggle(candidate.block.id);
    setHandled((h) => [...h, candidate.block.id]);
    toast.success('Dolt. Du hittar det under "Anpassa hemskärmen".');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start gap-2">
        <EyeOff size={18} className="mt-0.5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Vill du göra hemskärmen kortare?</p>
          <p className="text-sm text-muted-foreground">
            Du har inte öppnat <strong>{candidate.block.label}</strong> på {candidate.days} dagar.
            Vi kan dölja det – det finns kvar och går att slå på igen när du vill.
          </p>
        </div>
        <button
          type="button"
          onClick={snooze}
          aria-label="Inte nu"
          className="p-1 text-muted-foreground hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={hide}
          className="press rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          Dölj det
        </button>
        <button
          type="button"
          onClick={() => setHandled((h) => [...h, candidate.block.id])}
          className="press rounded-xl border border-border px-3 py-2 text-sm font-medium"
        >
          Behåll
        </button>
      </div>
    </div>
  );
}
