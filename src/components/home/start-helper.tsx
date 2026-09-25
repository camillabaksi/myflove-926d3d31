import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import { START_SECONDS, formatCountdown, microStepFor } from "@/lib/start-helper";

/**
 * "Hjälp mig börja" – ett mikrosteg och två lugna minuter.
 * Inget sparas: det här handlar bara om att komma igång.
 */
export default function StartHelper({
  title,
  onDone,
  onClose,
}: {
  title: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [left, setLeft] = useState(START_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [left]);

  const finished = left <= 0;
  const progress = 1 - left / START_SECONDS;

  return (
    <div className="mt-4 rounded-2xl bg-muted/50 p-4" aria-live="polite">
      {finished ? (
        <>
          <p className="font-medium text-ink">{t("Bra start! Två minuter är gjorda.")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setLeft(START_SECONDS)}
              className="min-h-11 rounded-full"
            >
              {t("Fortsätt två minuter till")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDone}
              className="min-h-11 rounded-full"
            >
              {t("Jag är klar")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="min-h-11 rounded-full text-muted-foreground"
            >
              {t("Ta en paus")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("Börja bara här:")}</p>
          <p className="mt-1 font-medium text-ink">{t(microStepFor(title))}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-lg font-bold tabular-nums text-primary">
              {formatCountdown(left)}
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
          >
            {t("Stäng")}
          </button>
        </>
      )}
    </div>
  );
}
