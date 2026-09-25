import { useState } from "react";
import { Link } from "wouter";
import { useEnergyBattery } from "@/hooks/use-energy-battery";
import { useLang } from "@/hooks/use-language";
import { orkWord } from "@/lib/ork-word";

/** Orken i ord – Låg / Lagom / God. Procent bara på begäran. */
export { orkWord };

export default function OrkSummary() {
  const { t } = useLang();
  const { reading } = useEnergyBattery();
  const [open, setOpen] = useState(false);
  const pct = Math.max(0, Math.min(100, Math.round(reading.now)));
  const word = orkWord(pct);

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft"
      aria-label={t("Din ork")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-bold text-ink">{t(word.label)}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-xs font-medium text-primary underline underline-offset-2"
        >
          {t("Hur räknas det?")}
        </button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t(word.text)}</p>
      {open && (
        <div className="mt-3 space-y-1 rounded-2xl bg-secondary/40 p-3 text-sm text-ink">
          <p>
            {t("Just nu ungefär")} {pct}%.
          </p>
          <p>1. {t("Det du loggat om hur du mår.")}</p>
          <p>2. {t("Det du har gjort idag.")}</p>
          <p>3. {t("Hur mycket du har kvar på dagen.")}</p>
          <Link
            href="/mitt-batteri"
            className="inline-block pt-1 text-xs font-semibold text-primary"
          >
            {t("Se mer om ditt batteri")}
          </Link>
        </div>
      )}
    </section>
  );
}
