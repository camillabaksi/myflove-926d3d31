import { useMemo, useState } from "react";
import { Plus, Trash2, MapPin, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollapsibleSection from "@/components/collapsible-section";
import HelpHint from "@/components/help-hint";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { parseScheduleText } from "@/lib/schedule-parse";

export interface ChildScheduleEntry {
  id: string;
  /** 0 = måndag … 6 = söndag */
  weekday: number;
  start: string; // HH:MM
  end?: string; // HH:MM
  title: string;
  location?: string;
  teacher?: string;
}

const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const SHORT = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const KEY = "myflove-child-schedules";

const newId = () => Math.random().toString(36).slice(2, 11);
/** JS getDay(): 0 = söndag → vårt index där 0 = måndag */
const todayIndex = () => (new Date().getDay() + 6) % 7;

export default function ChildSchedule({
  childId,
  childName,
  canEdit,
}: {
  childId: string;
  childName: string;
  canEdit: boolean;
}) {
  const [all, setAll] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(KEY, {});
  const entries = useMemo(() => all[childId] ?? [], [all, childId]);

  const [weekday, setWeekday] = useState(todayIndex());
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const save = (next: ChildScheduleEntry[]) =>
    setAll((prev) => ({ ...prev, [childId]: next }));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    save([
      ...entries,
      {
        id: newId(),
        weekday,
        start,
        end: end || undefined,
        title: title.trim(),
        location: location.trim() || undefined,
        teacher: teacher.trim() || undefined,
      },
    ]);
    setTitle("");
    setLocation("");
    setTeacher("");
    setEnd("");
  };

  const remove = (id: string) => save(entries.filter((e) => e.id !== id));

  const importPaste = () => {
    const parsed = parseScheduleText(paste);
    if (parsed.length === 0) return;
    save([
      ...entries,
      ...parsed.map((p) => ({
        id: newId(),
        weekday: p.weekday,
        start: p.start,
        end: p.end,
        title: p.title,
        location: p.location,
      })),
    ]);
    setPaste("");
    setShowPaste(false);
  };

  const byDay = useMemo(() => {
    const map: ChildScheduleEntry[][] = [[], [], [], [], [], [], []];
    for (const e of entries) (map[e.weekday] ?? map[0]).push(e);
    for (const list of map) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [entries]);

  const today = todayIndex();

  const next = useMemo(() => {
    if (entries.length === 0) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const list = (byDay[day] ?? []).filter((e) => offset > 0 || toMin(e.start) >= nowMin);
      if (list[0]) return { entry: list[0], offset, day };
    }
    return null;
  }, [entries, byDay, today]);

  return (
    <section className="surface-card p-5">
      <CollapsibleSection
        id="Barnets skolschema"
        title={
          <span className="flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            {childName}s skolschema
            <HelpHint label="barnets skolschema">
              Lägg in skolschemat en gång – det ligger kvar vecka efter vecka. Dagens lektioner markeras och nästa lektion visas överst.
            </HelpHint>
          </span>
        }
        headingClassName="text-lg font-semibold"
        className="space-y-4"
      >
        {next && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-3">
            <div className="text-xs text-muted-foreground">
              Nästa lektion · {next.offset === 0 ? "idag" : next.offset === 1 ? "imorgon" : DAYS[next.day]}
            </div>
            <div className="font-medium">
              {next.entry.start}
              {next.entry.end ? `–${next.entry.end}` : ""} {next.entry.title}
            </div>
            {(next.entry.location || next.entry.teacher) && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin size={12} /> {[next.entry.location, next.entry.teacher].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        )}

        {canEdit && (
          <form onSubmit={add} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekday(i)}
                  aria-pressed={weekday === i}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    weekday === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ämne, t.ex. Matematik"
              className="h-11 rounded-2xl"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label="Starttid"
                className="h-11 rounded-2xl"
              />
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-label="Sluttid (valfritt)"
                className="h-11 rounded-2xl"
              />
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sal eller plats (valfritt)"
              className="h-11 rounded-2xl"
            />
            <Input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Lärare (valfritt)"
              className="h-11 rounded-2xl"
            />
            <div className="flex gap-2">
              <Button type="submit" className="h-11 rounded-2xl flex-1">
                <Plus size={18} className="mr-1" /> Lägg till lektion
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={() => setShowPaste((v) => !v)}
              >
                Klistra in
              </Button>
            </div>

            {showPaste && (
              <div className="space-y-2">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  rows={5}
                  placeholder={"Måndag 08:20-09:05 Matematik, sal 3\nTis 09:15-10:00 Svenska, sal 12"}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm"
                />
                <Button type="button" variant="outline" className="h-10 rounded-2xl" onClick={importPaste}>
                  Tolka och lägg till
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Inget skolschema än – lägg in en lektion i taget, eller klistra in hela schemat.
            </p>
          ) : (
            DAYS.map((day, i) =>
              (byDay[i] ?? []).length === 0 ? null : (
                <div
                  key={day}
                  className={`rounded-2xl border p-3 ${
                    i === today ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="text-sm font-semibold mb-2">
                    {day}
                    {i === today && <span className="text-primary text-xs ml-2">idag</span>}
                  </div>
                  <ul className="space-y-1.5">
                    {(byDay[i] ?? []).map((e) => (
                      <li key={e.id} className="flex items-start gap-3 text-sm">
                        <span className="tabular-nums text-muted-foreground w-24 shrink-0">
                          {e.start}
                          {e.end ? `–${e.end}` : ""}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium">{e.title}</span>
                          {(e.location || e.teacher) && (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <MapPin size={12} /> {[e.location, e.teacher].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => remove(e.id)}
                            aria-label={`Ta bort ${e.title}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
}
