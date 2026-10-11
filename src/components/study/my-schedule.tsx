import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  ImageIcon,
  Paperclip,
  Coffee,
  UtensilsCrossed,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useScheduleFiles, type ScheduleFile } from "@/hooks/use-schedule-files";
import { nextOccurrence } from "@/lib/schedule-parse";
import {
  WEEKDAYS,
  LECTURE_KIND_LABEL,
  type Lecture,
  type LectureKind,
} from "@/lib/study-calendar";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const field =
  "w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary";

function scrollToImport() {
  document.getElementById("schema-import")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function kindIcon(lecture: Lecture) {
  if (lecture.kind === "break")
    return <Coffee className="h-4 w-4 shrink-0 text-muted-foreground" />;
  if (lecture.kind === "lunch")
    return <UtensilsCrossed className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <CalendarDays className="h-4 w-4 shrink-0 text-primary" />;
}

type Draft = Omit<Lecture, "id"> & { id?: string };

const emptyDraft = (): Draft => ({
  title: "",
  weekday: 0,
  start: "09:00",
  end: "10:00",
  location: "",
  kind: "lecture",
});

/**
 * "Mitt schema" – originalfilen, dagens och kommande hållpunkter samt valet
 * att visa nästa lektion på Hem. Här kan allt i schemat ändras för hand,
 * även det Flow läst in från ett uppladdat schema.
 */
export function MySchedule() {
  const {
    lectures,
    addLecture,
    updateLecture,
    removeLecture,
    showNextLectureOnHome,
    setShowNextLectureOnHome,
  } = useStudySchedule();
  const { files } = useScheduleFiles();
  const [viewFile, setViewFile] = useState<ScheduleFile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const latest = files[0] ?? null;

  const upcoming = useMemo(() => {
    const now = new Date();
    return lectures
      .map((l) => ({ lecture: l, at: nextOccurrence(l, now) }))
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, 8);
  }, [lectures]);

  const allSorted = useMemo(
    () =>
      [...lectures].sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)),
    [lectures],
  );

  const saveDraft = () => {
    if (!draft) return;
    const clean: Omit<Lecture, "id"> = {
      title: draft.title.trim() || "Ny hållpunkt",
      weekday: draft.weekday,
      start: draft.start,
      end: draft.end,
      location: draft.location?.trim() || undefined,
      kind: draft.kind ?? "lecture",
    };
    if (draft.id) updateLecture(draft.id, clean);
    else addLecture(clean);
    setDraft(null);
  };

  return (
    <section className={card} aria-labelledby="mitt-schema">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="mitt-schema" className="font-display text-lg text-ink">
            Mitt schema
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {latest
              ? "Ditt uppladdade schema finns sparat – öppna eller ändra det när du vill."
              : "Ladda upp ditt schema eller lägg in tiderna själv."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {latest && (
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => setViewFile(latest)}
            >
              <Paperclip className="mr-2 h-4 w-4" /> Öppna schema
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={scrollToImport}>
            {latest ? "Byt schema" : "Lägg till schema"}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Dina lektioner idag och kommande
        </p>
        {upcoming.length ? (
          <ul className="mt-2 space-y-1">
            {upcoming.map(({ lecture, at }) => (
              <li
                key={`${lecture.id}-${at.getTime()}`}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-ink"
              >
                <span className="w-12 shrink-0 tabular-nums text-muted-foreground">
                  {lecture.start}
                </span>
                {kindIcon(lecture)}
                <span className="min-w-0 flex-1 truncate">
                  {lecture.title}
                  {lecture.location ? ` · ${lecture.location}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {WEEKDAYS[lecture.weekday]}
                  {lecture.kind && lecture.kind !== "lecture"
                    ? ` · ${LECTURE_KIND_LABEL[lecture.kind]}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Inga lektioner än. Ladda upp schemat nedan eller lägg in dem för hand. 💙
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {editing ? "Klar med ändringarna" : "Ändra schemat"}
        </Button>
        <Button variant="secondary" className="rounded-full" onClick={() => setDraft(emptyDraft())}>
          <Plus className="mr-2 h-4 w-4" /> Lägg till tid
        </Button>
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            Här kan du ändra allt i schemat – även tider som Pace läst in åt dig.
          </p>
          {allSorted.length ? (
            <ul className="space-y-1">
              {allSorted.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm text-ink"
                >
                  <span className="w-10 shrink-0 text-xs text-muted-foreground">
                    {WEEKDAYS[l.weekday]}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {l.start}–{l.end}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...l })}
                    aria-label={`Ändra ${l.title}`}
                    className="press rounded-full p-2 text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLecture(l.id)}
                    aria-label={`Ta bort ${l.title}`}
                    className="press rounded-full p-2 text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Schemat är tomt just nu.</p>
          )}
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showNextLectureOnHome}
          onChange={(e) => setShowNextLectureOnHome(e.target.checked)}
          className="h-4 w-4 accent-current"
        />
        Vill du visa nästa lektion på Hem?
      </label>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Ändra tid" : "Ny tid i schemat"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <label className="block text-sm text-muted-foreground">
                Vad är det?
                <input
                  className={`mt-1 ${field}`}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value.slice(0, 120) })}
                  placeholder="T.ex. Matematik"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Dag
                <select
                  className={`mt-1 ${field}`}
                  value={draft.weekday}
                  onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}
                >
                  {WEEKDAYS.map((w, i) => (
                    <option key={w} value={i}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="flex-1 text-sm text-muted-foreground">
                  Börjar
                  <input
                    type="time"
                    className={`mt-1 ${field}`}
                    value={draft.start}
                    onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                  />
                </label>
                <label className="flex-1 text-sm text-muted-foreground">
                  Slutar
                  <input
                    type="time"
                    className={`mt-1 ${field}`}
                    value={draft.end}
                    onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm text-muted-foreground">
                Var?
                <input
                  className={`mt-1 ${field}`}
                  value={draft.location ?? ""}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value.slice(0, 80) })}
                  placeholder="Sal eller plats"
                />
              </label>
              <label className="block text-sm text-muted-foreground">
                Typ
                <select
                  className={`mt-1 ${field}`}
                  value={draft.kind ?? "lecture"}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as LectureKind })}
                >
                  {(Object.keys(LECTURE_KIND_LABEL) as LectureKind[]).map((k) => (
                    <option key={k} value={k}>
                      {LECTURE_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button className="rounded-full" onClick={saveDraft}>
                  Spara
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
                  Avbryt
                </Button>
                {draft.id && (
                  <Button
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                    onClick={() => {
                      removeLecture(draft.id as string);
                      setDraft(null);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Ta bort
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewFile} onOpenChange={(open) => !open && setViewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewFile?.name}</DialogTitle>
          </DialogHeader>
          {viewFile &&
            (viewFile.mime.startsWith("image/") ? (
              <img
                src={viewFile.dataUrl}
                alt={`Schemafil ${viewFile.name}`}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
            ) : (
              <a
                href={viewFile.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary underline"
              >
                {viewFile.mime.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Öppna originalfilen
              </a>
            ))}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default MySchedule;
