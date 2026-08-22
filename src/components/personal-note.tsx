import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTasks } from "@/hooks/use-data";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useVisitStreak } from "@/hooks/use-visit-streak";
import { getPersonalNote } from "@/lib/personal-messages";

/** Liten varm rad från Flow, personlig utifrån dagen och hur det gått. */
export default function PersonalNote() {
  const [mounted, setMounted] = useState(false);
  const [nudge, setNudge] = useState(0);
  const { name } = useUserProfile();
  const { streak, thisWeek } = useVisitStreak();
  const { tasks } = useTasks();

  useEffect(() => setMounted(true), []);

  const note = useMemo(() => {
    const today = todayISO();
    const todays = tasks.filter((t) => !t.dueDate || t.dueDate === today);
    const day = new Date().getDay();
    return getPersonalNote({
      name,
      hour: new Date().getHours(),
      streak,
      thisWeek,
      openToday: todays.filter((t) => !t.completed).length,
      doneToday: todays.filter((t) => t.completed).length,
      isWeekend: day === 0 || day === 6,
      variation: nudge,
    });
    // nudge byter meddelande när man klickar på uppdatera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, name, streak, thisWeek, nudge, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-sage/25 p-4 animate-fade-in">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-lg">
        {note.emoji}
      </div>
      <p className="flex-1 leading-snug text-ink">{note.text}</p>
      <button
        type="button"
        aria-label="Visa ett annat meddelande"
        onClick={() => setNudge((n) => n + 1)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-primary"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}
