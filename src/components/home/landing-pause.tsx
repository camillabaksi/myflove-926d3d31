import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import { LANDING_SECONDS, formatCountdown } from "@/lib/start-helper";

/**
 * Mjuk övergång – två minuter att landa mellan två saker.
 * Alltid frivillig, alltid avbrytbar. Respekterar "reduced motion".
 */
export default function LandingPause({ onReady }: { onReady: () => void }) {
  const { t } = useLang();
  const [left, setLeft] = useState(LANDING_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [left]);

  useEffect(() => {
    if (left <= 0) onReady();
  }, [left, onReady]);

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted/50 p-4" aria-live="polite">
      <span
        className="h-12 w-12 shrink-0 rounded-full bg-primary/25 motion-safe:animate-pulse"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{t("Landa lite.")}</p>
        <p className="text-sm text-muted-foreground">
          {t("Andas lugnt.")} {formatCountdown(left)}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onReady}
        className="min-h-11 shrink-0 rounded-full"
      >
        {t("Redo nu")}
      </Button>
    </div>
  );
}
