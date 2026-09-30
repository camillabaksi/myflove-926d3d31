import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export type AttemptResult = "provat" | "fungerade" | "fungerade inte";

export interface SituationLogEntry {
  id: string;
  /** Stabil barnkoppling för nya poster; gamla poster kan fortfarande läsas via who. */
  childId?: string;
  at: number;
  category: string;
  text: string;
  who: string;
  attempts: { title: string; result: AttemptResult }[];
  helped: string | null;
}

const RESULT_STYLE: Record<AttemptResult, string> = {
  provat: "bg-muted text-muted-foreground",
  fungerade: "bg-mint/70 text-ink",
  "fungerade inte": "bg-blush/60 text-ink",
};

/** Tidigare situationer och vilka vägar som provats – sparas i användarens molnlagring. */
export default function SituationLog({
  entries,
  onDelete,
  heading,
}: {
  entries: SituationLogEntry[];
  onDelete: (id: string) => void;
  /** Egen rubrik, t.ex. när listan ligger inuti "Tidigare situationer"-sektionen. */
  heading?: string;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-3" data-testid="situation-log">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="press flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-ink"
      >
        {t(heading ?? "Tidigare situationer")} ({entries.length})
        <ChevronDown size={16} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl bg-muted/40 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{t(e.category)} · {e.who === "Du" ? t("Du") : e.who}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    {e.text && ` · ${e.text}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  aria-label={t("Ta bort")}
                  className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {e.attempts.map((a, i) => (
                  <li key={`${a.title}-${i}`} className={cn("rounded-full px-2.5 py-1 text-xs", RESULT_STYLE[a.result])}>
                    {t(a.title)} – {t(a.result)}
                  </li>
                ))}
              </ul>
              {e.helped && <p className="mt-2 text-xs text-ink">{t("Hjälpte mest")}: {t(e.helped)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
