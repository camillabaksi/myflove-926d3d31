import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useStudyProfile } from "@/hooks/use-study-profile";
import { getArea } from "@/lib/life-areas";
import { hasStudyProfile, studySuggestions, type StudyDayItem } from "@/lib/study-profile";

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Personliga studieförslag utifrån studieprofilen och veckans verkliga läge. */
export default function StudySuggestions() {
  const { activeTasks } = useTasks();
  const { flow, energy } = useFlowScore();
  const { profile } = useStudyProfile();

  const suggestions = useMemo(() => {
    if (!hasStudyProfile(profile) || !profile.enabled) return [];
    const today = iso();
    const weekEnd = iso(9);
    const upcoming: StudyDayItem[] = activeTasks
      .filter((t) => getArea(t) === "studier")
      .filter((t) => !t.dueDate || (t.dueDate >= today && t.dueDate <= weekEnd))
      .map((t) => ({ title: t.title, date: t.dueDate, time: t.time }));

    return studySuggestions(profile, {
      upcoming,
      energy,
      flowScore: flow.score,
      capacityMinutes: flow.capacityMinutes,
    });
  }, [activeTasks, profile, energy, flow.score, flow.capacityMinutes]);

  if (!suggestions.length) return null;

  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink">
        <Sparkles size={18} className="text-primary" aria-hidden="true" />
        Flow tänker på dina studier
      </h2>
      <ul className="mt-3 space-y-3">
        {suggestions.map((s) => (
          <li key={s.title} className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="font-medium text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            {s.href && (
              <Link
                to={s.href}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {s.hrefLabel ?? "Öppna"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
