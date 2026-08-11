import { useMemo, useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { useTasks, useMoods } from "@/hooks/use-data";
import { useVisitStreak } from "@/hooks/use-visit-streak";

const MOOD_WORDS = ["tungt", "trögt", "sådär", "helt okej", "riktigt fint"];

/**
 * "Din vecka i Flow" – en varm söndagssammanfattning som ger en anledning
 * att titta in även när det inte finns något att bocka av.
 */
export default function WeekInFlow() {
  const { completedTasks } = useTasks();
  const { moods } = useMoods();
  const { thisWeek, streak } = useVisitStreak();
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const done = completedTasks.filter((t) => (t.completedAt ?? t.createdAt) >= since);
    const weekMoods = moods.filter((m) => m.date >= since);
    const avg =
      weekMoods.length > 0
        ? weekMoods.reduce((s, m) => s + m.score, 0) / weekMoods.length
        : null;
    return { doneCount: done.length, done, moodCount: weekMoods.length, avg };
  }, [completedTasks, moods]);

  const moodWord =
    summary.avg !== null ? MOOD_WORDS[Math.min(4, Math.max(0, Math.round(summary.avg) - 1))] : null;

  const message = (() => {
    if (summary.doneCount === 0 && summary.moodCount === 0) {
      return "Veckan har varit tyst här – och det är också okej. Att bara titta in räknas.";
    }
    const parts: string[] = [];
    if (summary.doneCount > 0) {
      parts.push(
        summary.doneCount === 1
          ? "Du bockade av en sak den här veckan – den räknas."
          : `Du bockade av ${summary.doneCount} saker den här veckan.`
      );
    }
    if (moodWord) parts.push(`Ditt mående har i snitt känts ${moodWord}.`);
    if (streak >= 3) parts.push(`Och du har tittat in ${thisWeek} dagar – fin rytm.`);
    return parts.join(" ");
  })();

  return (
    <section className="rounded-3xl border border-sage/60 bg-sage/20 p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-background/70 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-ink">Din vecka i Flow</h2>
          <p className="text-sm text-ink/80 leading-relaxed mt-1">{message}</p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {open ? "Dölj detaljer" : "Visa detaljer"}
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-background/70 p-3">
                  <p className="text-2xl font-bold text-ink">{summary.doneCount}</p>
                  <p className="text-[11px] text-muted-foreground">avbockat</p>
                </div>
                <div className="rounded-2xl bg-background/70 p-3">
                  <p className="text-2xl font-bold text-ink">{summary.moodCount}</p>
                  <p className="text-[11px] text-muted-foreground">incheckningar</p>
                </div>
                <div className="rounded-2xl bg-background/70 p-3">
                  <p className="text-2xl font-bold text-ink">{thisWeek}</p>
                  <p className="text-[11px] text-muted-foreground">dagar här</p>
                </div>
              </div>

              {summary.done.length > 0 && (
                <ul className="space-y-1.5">
                  {summary.done.slice(0, 5).map((t) => (
                    <li key={t.id} className="text-sm text-ink/80 flex items-start gap-2">
                      <span aria-hidden="true" className="text-primary">✓</span>
                      <span className="line-clamp-1">{t.title ?? (t as { text?: string }).text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
