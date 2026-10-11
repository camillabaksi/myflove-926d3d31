import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { CalendarCheck, Plus, Trash2, RefreshCw, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-data";
import { useFlowStudy } from "@/hooks/use-flowstudy";
import { useCourses } from "@/hooks/use-courses";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import CollapsibleSection from "@/components/collapsible-section";
import {
  SYNC_PREFIX,
  WEEKDAYS,
  planStudyCalendar,
  toMin,
  type BusySlot,
  type PlannedEntry,
} from "@/lib/study-calendar";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

const TYPE_LABEL: Record<PlannedEntry["type"], string> = {
  lecture: "Föreläsning",
  exam: "Prov",
  revision: "Repetition",
};

function prettyDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

export function StudyCalendarSync() {
  const { tasks, syncGeneratedTasks } = useTasks();
  const { sets } = useFlowStudy();
  const { activeCourses } = useCourses();
  const { lectures, addLecture, removeLecture, settings, patchSettings, autoSync, setAutoSync } =
    useStudySchedule();

  const [title, setTitle] = useState("");
  const [weekday, setWeekday] = useState(0);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [courseId, setCourseId] = useState("");
  const [location, setLocation] = useState("");

  const exams = useMemo(
    () =>
      sets
        .filter((s) => s.examDate)
        .map((s) => ({
          id: s.id,
          title: s.title,
          date: s.examDate as string,
          courseId: s.courseId,
        })),
    [sets],
  );

  /** Redan bokade tider som inte kommer från StudyFlow-synken. */
  const busy: BusySlot[] = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && t.time && t.dueDate && !t.syncKey?.startsWith(SYNC_PREFIX))
        .map((t) => {
          const s = toMin(t.time as string);
          return { date: t.dueDate as string, start: s, end: s + 60 };
        }),
    [tasks],
  );

  const plan = useMemo(
    () => planStudyCalendar({ lectures, exams, busy, settings }),
    [lectures, exams, busy, settings],
  );

  const doSync = (silent = false) => {
    syncGeneratedTasks(
      SYNC_PREFIX,
      plan.map((e) => ({
        syncKey: e.syncKey,
        title: e.title,
        dueDate: e.date,
        time: e.time,
        reminderMinutesBefore: e.reminderMinutesBefore,
        area: "studier" as const,
        courseId: e.courseId,
      })),
    );
    if (!silent) {
      toast.success(
        plan.length
          ? `${plan.length} poster ligger nu i kalendern 💙`
          : "Inget att synka än – lägg in ditt schema eller ett prov.",
      );
    }
  };

  // Auto-synk när schemat, proven eller inställningarna ändras.
  const planKey = plan.map((e) => `${e.syncKey}@${e.time}`).join("|");
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSync) return;
    if (lastKey.current === planKey) return;
    lastKey.current = planKey;
    doSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey, autoSync]);

  const grouped = useMemo(() => {
    const map = new Map<string, PlannedEntry[]>();
    plan.slice(0, 40).forEach((e) => {
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    });
    return Array.from(map.entries());
  }, [plan]);

  return (
    <section id="veckoschema" className={`${card} scroll-mt-24`}>
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Schema & kalender
          </span>
        }
        headingClassName={sectionTitle}
      >
        <p className="mt-1 text-sm text-muted-foreground">
          Lägg in dina föreläsningar en gång. Pace lägger lugna repetitionspass i luckorna som blir
          kvar – automatiskt i{" "}
          <Link href="/kalender" className="underline">
            kalendern
          </Link>
          .
        </p>

        {/* Lägg till föreläsning */}
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            addLecture({
              title: title.trim(),
              weekday,
              start,
              end,
              courseId: courseId || undefined,
              location: location.trim() || undefined,
            });
            setTitle("");
            setLocation("");
            toast.success("Föreläsning tillagd i schemat");
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Föreläsning, t.ex. Statistik – sal B2"
            aria-label="Föreläsningens namn"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              aria-label="Veckodag"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
            >
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Starttid"
              className="w-28"
            />
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              aria-label="Sluttid"
              className="w-28"
            />
            {activeCourses.length > 0 && (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                aria-label="Kurs"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
              >
                <option value="">Ingen kurs</option>
                {activeCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sal (valfritt)"
              aria-label="Plats"
              className="w-32"
            />
            <Button type="submit" size="icon" aria-label="Lägg till föreläsning">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {lectures.length > 0 && (
          <ul className="mt-3 space-y-2">
            {lectures
              .slice()
              .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
              .map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3 text-sm"
                >
                  <GraduationCap className="h-4 w-4 text-gold" />
                  <span className="flex-1 text-ink">
                    {WEEKDAYS[l.weekday]} {l.start}–{l.end} · {l.title}
                    {l.location ? ` (${l.location})` : ""}
                  </span>
                  <button
                    onClick={() => removeLecture(l.id)}
                    aria-label={`Ta bort ${l.title}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        )}

        {/* Inställningar för tidsluckor */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Plugg mellan</span>
          <Input
            type="time"
            value={settings.dayStart}
            onChange={(e) => patchSettings({ dayStart: e.target.value })}
            aria-label="Tidigast plugg"
            className="w-28"
          />
          <span>och</span>
          <Input
            type="time"
            value={settings.dayEnd}
            onChange={(e) => patchSettings({ dayEnd: e.target.value })}
            aria-label="Senast plugg"
            className="w-28"
          />
          <span>· pass</span>
          <select
            value={settings.sessionMinutes}
            onChange={(e) => patchSettings({ sessionMinutes: Number(e.target.value) })}
            aria-label="Passlängd"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
          >
            {[15, 20, 25, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={settings.includeExams}
            onChange={(e) => patchSettings({ includeExams: e.target.checked })}
            className="h-4 w-4 accent-current"
          />
          Lägg även själva provdagen i kalendern
        </label>

        <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={settings.includeRevisions}
            onChange={(e) => patchSettings({ includeRevisions: e.target.checked })}
            className="h-4 w-4 accent-current"
          />
          Lägg in automatiska repetitionspass
        </label>

        <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="h-4 w-4 accent-current"
          />
          Håll kalendern uppdaterad automatiskt
        </label>

        <Button
          variant="secondary"
          className="mt-3 w-full rounded-full"
          onClick={() => doSync(false)}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Synka till kalendern
        </Button>

        {grouped.length > 0 ? (
          <div className="mt-4 space-y-3">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {prettyDate(date)}
                </p>
                <ul className="mt-1 space-y-1">
                  {items.map((e) => (
                    <li
                      key={e.syncKey}
                      className="flex items-center gap-2 rounded-2xl bg-sage/15 px-3 py-2 text-sm text-ink"
                    >
                      <span className="w-12 shrink-0 text-muted-foreground">{e.time}</span>
                      <span className="flex-1">{e.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {TYPE_LABEL[e.type]} · {e.minutes} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Inget planerat än. Lägg in en föreläsning ovan eller ett provdatum i Studiehjälp – så
            fyller Pace kalendern åt dig. 💙
          </p>
        )}
      </CollapsibleSection>
    </section>
  );
}

export default StudyCalendarSync;
