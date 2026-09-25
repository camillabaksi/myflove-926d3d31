import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useAdaptiveActivity } from "@/hooks/use-adaptive-activity";
import { useLang } from "@/hooks/use-language";
import { orkWord } from "@/lib/ork-word";

/**
 * "Dagens fokus" – samma lugna mall på alla områdessidor.
 *
 * Visar orken i ord (Låg / Lagom / God) och EN rimlig sak att göra just nu,
 * anpassad efter dagens kapacitet. Ingen ny data och ingen ny lagring –
 * allt kommer från befintliga Mitt batteri / FlowScore via useAdaptiveActivity.
 */
export default function AreaFocus({
  intent,
  lowHint,
  href,
  hrefLabel,
}: {
  /** Fritext som beskriver området, t.ex. "Jag vill träna". */
  intent: string;
  /** Extra mjuk formulering när orken är låg, t.ex. "Plocka 3 saker räcker." */
  lowHint?: string;
  href?: string;
  hrefLabel?: string;
}) {
  const { t } = useLang();
  const { percent, mode } = useCapacityMode();
  const { adapt } = useAdaptiveActivity();

  const word = orkWord(percent);
  const suggestion = adapt(intent);
  const low = mode === "lagt";

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft"
      aria-label={t("Dagens fokus")}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles size={14} className="text-primary" aria-hidden />
        {t("Dagens fokus")}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{t(suggestion.suggestion)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(word.label)} · {t(suggestion.firstStep)}
      </p>
      {low && lowHint && <p className="mt-1 text-sm text-muted-foreground">{t(lowHint)}</p>}
      {href && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {t(hrefLabel ?? "Öppna")} <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}
