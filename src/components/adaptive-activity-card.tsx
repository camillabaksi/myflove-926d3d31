import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { FlowMascot } from "@/components/flow-mascot";
import { useLang } from "@/hooks/use-language";
import { useTasks } from "@/hooks/use-data";
import { useAdaptiveActivity } from "@/hooks/use-adaptive-activity";
import { suggestionTitle } from "@/lib/adaptive-activity";
import { todayISO } from "@/lib/day";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * "Hur kan jag göra det här utifrån min kapacitet idag?"
 *
 * Kompakt Flow-kort enligt VISA → KLICKA → FÖRDJUPA. Kortet skapar ingen ny
 * datamodell: accepterar användaren förslaget läggs det som en vanlig uppgift
 * idag (eller som ett delsteg på en aktivitet som redan finns), så att
 * befintlig Min dag, kalender och "Hur kändes det?" fungerar precis som förut.
 */
export function AdaptiveActivityCard({
  text,
  /** Finns aktiviteten redan? Då skapas inget nytt – bara ett anpassat steg. */
  existingTaskId,
  /** Sant för sådant som redan har en fast tid – Flow ändrar aldrig tiden. */
  readOnly = false,
  source,
  onDone,
  className,
}: {
  text: string;
  existingTaskId?: string;
  readOnly?: boolean;
  source: string;
  onDone?: () => void;
  className?: string;
}) {
  const { t } = useLang();
  const { adapt, hasEnergyToday } = useAdaptiveActivity();
  const { addTask, addTaskStep } = useTasks();
  const [adjust, setAdjust] = useState<"mindre" | "större" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const s = useMemo(() => adapt(text, adjust), [adapt, text, adjust]);

  useEffect(() => {
    if (!text.trim()) return;
    track("flow_suggestion_shown", { source });
  }, [text, source]);

  if (!text.trim()) return null;

  const accept = () => {
    if (saved) return;
    if (existingTaskId) {
      // Aktiviteten finns redan – vi lägger bara till det anpassade steget.
      addTaskStep(existingTaskId, s.firstStep);
    } else {
      addTask(suggestionTitle(s), todayISO(), {
        note: s.firstStep,
        friction: s.minutes <= 10 ? "small" : s.minutes <= 25 ? "medium" : "large",
      });
    }
    setSaved(true);
    track("flow_suggestion_accepted", { source });
    toast.success(t("Den ligger i din dag nu. 💙"), {
      description: t("Bocka av den när du är klar, så frågar jag hur det kändes."),
    });
    onDone?.();
  };

  return (
    <section
      data-testid="adaptive-activity-card"
      aria-label={t("Anpassat förslag")}
      className={cn(
        "rounded-3xl border border-border/60 bg-lavender/25 p-3.5 shadow-soft sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <FlowMascot size="xs" mood="calm" className="mt-0.5 hidden shrink-0 sm:block" alt="" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{t(s.headline)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(s.capacityLine)}
            {!hasEnergyToday && ` · ${t("utifrån hur dagen ser ut")}`}
          </p>
          <p className="mt-2 text-sm text-ink">
            <span className="text-muted-foreground">{t("Mitt förslag")}: </span>
            {s.suggestion}
          </p>

          {s.fixedTimeNote && (
            <p className="mt-1 text-xs text-muted-foreground">{s.fixedTimeNote}</p>
          )}

          {expanded && (
            <div className="mt-3 space-y-2 rounded-2xl bg-card/70 p-3">
              <p className="text-sm text-ink">{s.firstStep}</p>
              {s.suggestRecovery && (
                <p className="text-xs text-muted-foreground">
                  {t("Känns det för mycket idag går det lika bra att vila i stället.")}{" "}
                  <Link
                    href="/aterhamtning"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {t("Öppna Återhämtning")}
                  </Link>
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {!readOnly && (
                <button
                  type="button"
                  onClick={accept}
                  disabled={saved}
                  className="press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none"
                >
                  {existingTaskId ? t("Lägg till steget") : t("Lägg i min dag")}
                  <ArrowRight size={15} aria-hidden />
                </button>
                )}
                {s.canShrink && (
                  <button
                    type="button"
                    onClick={() => setAdjust("mindre")}
                    className="press inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
                  >
                    {t("Mindre")}
                  </button>
                )}
                {s.canGrow && (
                  <button
                    type="button"
                    onClick={() => setAdjust("större")}
                    className="press inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
                  >
                    {t("Större")}
                  </button>
                )}
              </div>
            </div>
          )}

          {!expanded && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="press inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Sparkles size={15} aria-hidden />
                {t("Visa förslag")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpanded(true);
                  setAdjust(s.canShrink ? "mindre" : "större");
                }}
                className="press inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
              >
                {t("Ändra")}
              </button>
              <button
                type="button"
                onClick={() => {
                  track("flow_suggestion_rejected", { source });
                  onDone?.();
                }}
                className="press inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                {t("Senare")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdaptiveActivityCard;
