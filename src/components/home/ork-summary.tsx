import { useState } from "react";
import { Link } from "wouter";
import { useCapacityMode } from "@/hooks/use-capacity-mode";
import { useLang } from "@/hooks/use-language";
import { orkWord } from "@/lib/ork-word";
import { CAPACITY_META, type CapacityMode } from "@/lib/priority-engine";

/** Behålls som export för bakåtkompatibilitet. */
export { orkWord };

const MODES: CapacityMode[] = ["fullt", "mellan", "lagt"];

/**
 * Kapacitetsläget på Hem – 🟢 Fullt / 🟡 Mellan / 🔴 Lågt.
 * Ett tryck för att byta. Ingen procent, ingen beräkning.
 */
export default function OrkSummary() {
  const { t } = useLang();
  const { mode, setMode } = useCapacityMode();
  const [open, setOpen] = useState(false);

  return (
    <section
      className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-soft"
      aria-label={t("Kapacitetsläge")}
      data-testid="capacity-summary"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-bold text-ink">{t("Kapacitetsläge")}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="min-h-11 text-xs font-medium text-primary underline underline-offset-2"
        >
          {t("Vad betyder det?")}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("Kapacitetsläge")}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-2xl border px-2 text-sm font-semibold transition ${
              mode === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-ink"
            }`}
          >
            <span aria-hidden>{CAPACITY_META[m].dot}</span> {t(CAPACITY_META[m].label)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t(CAPACITY_META[mode].meaning)}</p>
      {open && (
        <div className="mt-3 space-y-1 rounded-2xl bg-secondary/40 p-3 text-sm text-ink">
          <p>{t("Du väljer själv hur mycket som ryms idag. Läget ändras bara när du ändrar det.")}</p>
          <p>{t("Planen krymper när läget är lägre – det viktigaste ligger kvar.")}</p>
          <Link href="/mitt-batteri" className="inline-block pt-1 text-xs font-semibold text-primary">
            {t("Se kapacitet & mönster")}
          </Link>
        </div>
      )}
    </section>
  );
}
