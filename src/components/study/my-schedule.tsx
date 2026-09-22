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

/**
 * "Mitt schema" – originalfilen, dagens och kommande hållpunkter samt valet
 * att visa nästa lektion på Hem. Använder befintliga scheman och filer.
 */
export function MySchedule() {
  const { lectures, showNextLectureOnHome, setShowNextLectureOnHome } = useStudySchedule();
  const { files } = useScheduleFiles();
  const [viewFile, setViewFile] = useState<ScheduleFile | null>(null);
  const latest = files[0] ?? null;

  const upcoming = useMemo(() => {
    const now = new Date();
    return lectures
      .map((l) => ({ lecture: l, at: nextOccurrence(l, now) }))
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, 8);
  }, [lectures]);

  return (
    <section className={card} aria-labelledby="mitt-schema">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="mitt-schema" className="font-display text-lg text-ink">
            Mitt schema
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {latest
              ? "Ditt uppladdade schema finns sparat – öppna det när du vill."
              : "Ladda upp ditt schema så håller Flow koll på dina lektioner."}
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

      <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={showNextLectureOnHome}
          onChange={(e) => setShowNextLectureOnHome(e.target.checked)}
          className="h-4 w-4 accent-current"
        />
        Vill du visa nästa lektion på Hem?
      </label>

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
