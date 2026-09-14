import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { nextOccurrence } from "@/lib/schedule-parse";

/**
 * En diskret rad på Hem med nästa lektion – visas bara om användaren
 * har valt det i Studier. Ingen egen datamodell, samma schema som där.
 */
export function NextLectureHomeRow() {
  const { lectures, showNextLectureOnHome } = useStudySchedule();

  const next = useMemo(() => {
    if (!lectures.length) return null;
    const now = new Date();
    return lectures
      .map((l) => ({ lecture: l, at: nextOccurrence(l, now) }))
      .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  }, [lectures]);

  if (!showNextLectureOnHome || !next) return null;

  const when = next.at.toLocaleString("sv-SE", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href="/studyflow"
      data-testid="home-next-lecture"
      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 text-sm font-medium text-ink shadow-soft transition-colors hover:border-primary/35 hover:bg-card"
    >
      <GraduationCap className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 truncate">
        Nästa: {next.lecture.title} · {when}
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
    </Link>
  );
}

export default NextLectureHomeRow;
