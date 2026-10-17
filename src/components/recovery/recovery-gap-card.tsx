import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Leaf, OctagonX, Sparkles, Sunrise, Wind, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecoveryGaps } from "@/hooks/use-recovery-gaps";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { RecoveryGap, RecoveryOption } from "@/lib/recovery-gaps";

/**
 * "Dagen går inte att ändra – men vi kan göra den lite snällare."
 *
 * Visar realistiska luckor i dagens befintliga hållpunkter och en
 * återhämtning som får plats. Inget bokas förrän användaren säger ja, och
 * förslagen är alltid förslag – aldrig krav eller bedömningar.
 */
const KIND_ICON: Record<RecoveryOption["kind"], LucideIcon> = {
  paus: Leaf,
  ljusboost: Sunrise,
  stopp: OctagonX,
  vardag: Wind,
};

export default function RecoveryGapCard({
  className,
  includeFamily = true,
  title,
}: {
  className?: string;
  includeFamily?: boolean;
  title?: string;
}) {
  const { t } = useLang();
  const { result, accept } = useRecoveryGaps({ includeFamily });
  const [dismissed, setDismissed] = useState(false);
  const [picked, setPicked] = useState<{ gap: RecoveryGap; option: RecoveryOption } | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [accepted, setAccepted] = useState<{ gap: RecoveryGap; option: RecoveryOption } | null>(
    null,
  );

  const current = useMemo(
    () => picked ?? (result.gaps[0] ? { gap: result.gaps[0], option: result.gaps[0].option } : null),
    [picked, result.gaps],
  );

  const gapCount = result.gaps.length;
  useEffect(() => {
    if (gapCount > 0) track("recovery_gap_shown", { count: gapCount });
  }, [gapCount]);

  if (dismissed) return null;

  if (gapCount === 0 || !current) return <section className={cn("rounded-xl bg-card p-3", className)} aria-label={t("Hitta en lugnare väg")}><p className="text-sm text-muted-foreground">Just nu finns ingen säker ledig lucka att föreslå. Du kan ändå välja en kort paus själv eller prova en återhämtningsövning.</p><div className="mt-3 flex flex-wrap gap-2"><Link href="/aterhamtning?start=paus" className="inline-flex min-h-10 items-center rounded-xl bg-primary px-3 text-sm text-primary-foreground">Starta en paus</Link><Link href="/stop-paus" className="inline-flex min-h-10 items-center rounded-xl border px-3 text-sm">Stopp-knappen</Link></div></section>;

  const alternatives: { gap: RecoveryGap; option: RecoveryOption }[] = result.gaps.flatMap((gap) => [
    { gap, option: gap.option },
    ...gap.alternatives.map((option) => ({ gap, option })),
  ]);

  const onAccept = () => {
    const res = accept(current.gap, current.option);
    track("recovery_gap_accepted", { count: current.option.minutes });
    setAccepted(current);
    toast.success(
      res.created
        ? t("Inlagt i din dag. Du kan ändra eller ta bort det när du vill.")
        : t("Det ligger redan i din dag."),
    );
  };

  return (
    <section
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:p-5",
        className,
      )}
      aria-label={t("Återhämtning som får plats")}
      data-testid="recovery-gap-card"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title ?? t(result.headline)}</h2>
          <p className="text-xs text-muted-foreground">{t(result.intro)}</p>
        </div>
      </div>

      {accepted ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-ink">
            {t("Du har nu")} {accepted.option.minutes} {t("minuter återhämtning")}
            {accepted.gap.after ? ` ${t("innan")} ${accepted.gap.after.toLowerCase()}` : ""}.
          </p>
          <div className="flex flex-wrap gap-2">
            {accepted.option.href && (
              <Link
                href={accepted.option.href}
                className="press inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                {t("Öppna")} {t(accepted.option.label)}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link
              href="/min-dag"
              className="press inline-flex min-h-11 items-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-ink"
            >
              {t("Visa nästa steg")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              {(() => {
                const KindIcon = KIND_ICON[current.option.kind];
                return <KindIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />;
              })()}
              {current.gap.start}–{current.gap.end}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(current.option.label)} · {t(current.gap.note)}
            </p>
          </div>

          {result.preferenceNote && (
            <p className="text-xs text-muted-foreground">{t(result.preferenceNote)}</p>
          )}

          {showAlternatives && (
            <ul className="space-y-2" aria-label={t("Andra alternativ")}>
              {alternatives.map(({ gap, option }) => (
                <li key={`${gap.start}-${option.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked({ gap, option });
                      setShowAlternatives(false);
                    }}
                    className="press flex min-h-12 w-full items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 text-left text-sm text-ink"
                  >
                    {(() => {
                      const KindIcon = KIND_ICON[option.kind];
                      return <KindIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />;
                    })()}
                    <span className="min-w-0 flex-1 truncate">
                      {gap.start} · {t(option.label)} {option.minutes} min
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" className="min-h-11 rounded-2xl" onClick={onAccept}>
              {t("Ja, välj detta")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 rounded-2xl"
              onClick={() => setShowAlternatives((v) => !v)}
            >
              {t("Välj annan")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 rounded-2xl"
              onClick={() => {
                track("recovery_gap_dismissed");
                setDismissed(true);
              }}
            >
              {t("Nej tack")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
