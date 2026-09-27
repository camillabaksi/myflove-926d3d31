import { Check } from "lucide-react";

import { useLang } from "@/hooks/use-language";
import SituationLog, { type SituationLogEntry } from "@/components/family/situation-log";

/**
 * "Tidigare situationer" på Family Flow-sidan.
 * Samma logg som i "Hjälp med en situation", men alltid synlig här med en
 * kort summering av vilka vägar som fungerat för barnet.
 */
export default function SituationLogOverview({
  entries,
  onDelete,
}: {
  entries: SituationLogEntry[];
  onDelete: (id: string) => void;
}) {
  const { t } = useLang();
  if (entries.length === 0) return null;

  // Räkna vägarna som markerats "fungerade" – mest framgångsrika först.
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const a of e.attempts) {
      if (a.result === "fungerade") counts.set(a.title, (counts.get(a.title) ?? 0) + 1);
    }
  }
  const worked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <section
      className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5"
      data-testid="situation-log-overview"
    >
      <h2 className="text-base font-semibold text-ink">{t("Tidigare situationer")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("En egen logg över vad ni provat – så du snabbare hittar det som fungerar för barnet.")}
      </p>
      {worked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Vägar som fungerat")}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {worked.map(([title, n]) => (
              <li
                key={title}
                className="inline-flex items-center gap-1 rounded-full bg-mint/70 px-2.5 py-1 text-xs text-ink"
              >
                <Check size={12} aria-hidden /> {t(title)} · {n} {t("ggr")}
              </li>
            ))}
          </ul>
        </div>
      )}
      <SituationLog entries={entries} onDelete={onDelete} heading="Alla situationer" />
    </section>
  );
}
