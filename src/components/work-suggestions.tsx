import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useWorkProfile } from "@/hooks/use-work-profile";
import { getArea } from "@/lib/life-areas";
import { hasWorkProfile, workSuggestions, type WorkDayItem } from "@/lib/work-profile";

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Personliga jobbförslag som utgår från jobbprofilen och dagens verkliga läge. */
export default function WorkSuggestions() {
  const { activeTasks } = useTasks();
  const { flow, energy } = useFlowScore();
  const { profile } = useWorkProfile();

  const suggestions = useMemo(() => {
    if (!hasWorkProfile(profile) || !profile.enabled) return [];
    const jobItems = activeTasks.filter((t) => getArea(t) === "jobb");
    const toItem = (t: (typeof jobItems)[number]): WorkDayItem => ({
      title: t.title,
      date: t.dueDate,
      time: t.time,
    });
    const today = iso();
    const tomorrow = iso(1);
    return workSuggestions(profile, {
      today: jobItems.filter((t) => !t.dueDate || t.dueDate === today).map(toItem),
      tomorrow: jobItems.filter((t) => t.dueDate === tomorrow).map(toItem),
      energy,
      capacityMinutes: flow.capacityMinutes,
    });
  }, [activeTasks, profile, energy, flow.capacityMinutes]);

  if (!suggestions.length) return null;

  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink">
        <Sparkles size={18} className="text-primary" aria-hidden="true" />
        Flow tänker på ditt jobb
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
