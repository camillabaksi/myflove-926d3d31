import { useRef, useState } from "react";
import {
  Upload,
  Sparkles,
  FileUp,
  Check,
  CalendarCheck,
  ArrowDown,
  Pencil,
  ImageIcon,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useScheduleFiles, type ScheduleFile } from "@/hooks/use-schedule-files";
import { WEEKDAYS, LECTURE_KIND_LABEL, type LectureKind } from "@/lib/study-calendar";
import {
  dedupe,
  parseScheduleIcs,
  parseScheduleText,
  type ParsedLecture,
} from "@/lib/schedule-parse";
import { parseScheduleWithFlow } from "@/lib/schedule-import.functions";
import CollapsibleSection from "@/components/collapsible-section";
import {
  ACCEPT_SCHEDULE,
  isImageFile,
  isPdfFile,
  isTextFile,
  prepareUpload,
  readFileAsText,
} from "@/lib/file-formats";

const card = "rounded-3xl border-2 border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

export function ScheduleImport() {
  const { lectures, addLecture } = useStudySchedule();
  const { files, addFile, removeFile } = useScheduleFiles();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedLecture[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [viewFile, setViewFile] = useState<ScheduleFile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const goToSchedule = () => {
    const el = document.getElementById("veckoschema");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const keyOf = (l: ParsedLecture) => `${l.weekday}|${l.start}|${l.title.toLowerCase()}`;
  const existingKeys = new Set(lectures.map((l) => keyOf(l as ParsedLecture)));
  const newCount = preview.filter((l) => !existingKeys.has(keyOf(l))).length;
  const indexed = preview.map((l, idx) => ({ l, idx }));
  const grouped = Array.from(new Set(preview.map((l) => l.weekday)))
    .sort((a, b) => a - b)
    .map((weekday) => ({
      weekday,
      items: indexed
        .filter((row) => row.l.weekday === weekday)
        .sort((a, b) => a.l.start.localeCompare(b.l.start)),
    }));

  const updateLecture = (idx: number, patch: Partial<ParsedLecture>) =>
    setPreview((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const removeLecture = (idx: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  const show = (found: ParsedLecture[]) => {
    if (!found.length) {
      toast.error('Hittade inga lektioner – prova "Låt Flow tolka" istället.');
      return;
    }
    setEditIdx(null);
    setPreview(found);
    toast.success(`Hittade ${found.length} lektioner – granska och spara 💙`);
  };

  const handleFile = async (file: File) => {
    if (isTextFile(file)) {
      const content = await readFileAsText(file, 20000);
      const isIcs = /BEGIN:VCALENDAR/i.test(content) || file.name.toLowerCase().endsWith(".ics");
      setText(isIcs ? "" : content);
      show(isIcs ? parseScheduleIcs(content) : parseScheduleText(content));
      return;
    }

    if (!isImageFile(file) && !isPdfFile(file)) {
      toast.error(
        "Den filtypen kan inte läsas. Ladda upp en bild, PDF eller spara schemat som .ics, .txt eller .csv.",
      );
      return;
    }

    setBusy(true);
    try {
      const prepared = await prepareUpload(file);
      if (prepared.kind !== "file") return;
      addFile(prepared.file);
      toast.success("Filen är sparad – Flow läser av schemat…");
      const res = await parseScheduleWithFlow({ data: { file: prepared.file } });
      const found = dedupe(res.lectures);
      if (!found.length) {
        toast.error(
          "Flow kunde inte läsa av schemat i bilden. Filen är sparad – prova en tydligare bild eller klistra in texten.",
        );
        return;
      }
      setEditIdx(null);
      setPreview(found);
      toast.success(`Flow läste av ${found.length} lektioner – granska och spara 💙`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte läsa filen.");
    } finally {
      setBusy(false);
    }
  };

  const askFlow = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await parseScheduleWithFlow({ data: { text: text.slice(0, 8000) } });
      show(dedupe(res.lectures));
    } catch {
      toast.error("Flow kunde inte tolka schemat just nu. Prova att klistra in igen.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const existing = new Set(
      lectures.map((l) => `${l.weekday}|${l.start}|${l.title.toLowerCase()}`),
    );
    let added = 0;
    preview.forEach((l) => {
      const key = `${l.weekday}|${l.start}|${l.title.toLowerCase()}`;
      if (existing.has(key)) return;
      existing.add(key);
      addLecture(l);
      added += 1;
    });
    setPreview([]);
    setText("");
    setSavedCount(added);
    toast.success(
      added
        ? `${added} lektioner ligger nu i ditt veckoschema (Schema & kalender)`
        : "Allt fanns redan i ditt veckoschema 💙",
    );
    goToSchedule();
  };

  return (
    <section className={card}>
      <CollapsibleSection
        title={
          <span className="inline-flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Ladda upp ditt schema
          </span>
        }
        headingClassName={sectionTitle}
      >
        <p className="mt-1 text-sm text-muted-foreground">
          Klistra in schemat som text, ladda upp en fil (.ics, .txt, .csv) eller ta en bild/PDF på
          schemat. Flow läser av bilden och gör om den till ditt veckoschema – filen sparas så att
          du kan titta på originalet när du vill.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm">
          <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-ink">
            Sparas i <strong>ditt veckoschema</strong> här i StudyFlow
            {lectures.length > 0 ? ` · ${lectures.length} lektioner just nu` : ""}
          </span>
          <button
            type="button"
            onClick={goToSchedule}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-primary underline underline-offset-2"
          >
            Visa veckoschemat <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {savedCount !== null && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background p-3 text-sm text-ink">
            <Check className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {savedCount > 0
                ? `${savedCount} lektioner sparade i veckoschemat.`
                : "Lektionerna fanns redan i veckoschemat."}
            </span>
            <button
              type="button"
              onClick={goToSchedule}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-primary underline underline-offset-2"
            >
              Gå till veckoschemat <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
          Steg 1 · Klistra in eller ladda upp
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="mt-3 rounded-2xl"
          aria-label="Klistra in ditt schema"
          placeholder={"Mån 09:00-11:00 Statistik, sal B2\nTis 13-15 Programmering (D310)"}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => show(parseScheduleText(text))}
            disabled={!text.trim()}
          >
            Läs in texten
          </Button>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={askFlow}
            disabled={!text.trim() || busy}
          >
            <Sparkles className="mr-2 h-4 w-4" /> {busy ? "Flow läser…" : "Låt Flow tolka"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <FileUp className="mr-2 h-4 w-4" />
            {busy ? "Flow läser filen…" : "Ladda upp fil eller bild"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_SCHEDULE}
            className="sr-only"
            aria-label="Schemafil"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Dina schemafiler
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tryck på en fil för att titta på originalet igen.
            </p>
            <ul className="mt-2 space-y-1">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewFile(f)}
                    className="flex flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-ink hover:bg-muted/60"
                  >
                    {f.mime.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(f.addedAt).toLocaleDateString("sv-SE")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Ta bort ${f.name}`}
                    className="rounded-full p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Steg 2 · Granska och ändra
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.length} lektioner tolkade
              {newCount !== preview.length
                ? ` · ${newCount} nya, ${preview.length - newCount} finns redan`
                : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Klicka på en lektion för att ändra dag, tid eller namn innan du sparar.
            </p>
            <div className="mt-3 space-y-3">
              {grouped.map(({ weekday, items }) => (
                <div key={weekday}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {WEEKDAYS[weekday]}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink">
                    {items.map(({ l, idx }) =>
                      editIdx === idx ? (
                        <li
                          key={idx}
                          className="rounded-xl border border-primary/40 bg-primary/5 p-2"
                        >
                          <div className="flex flex-wrap gap-2">
                            <select
                              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                              aria-label="Veckodag"
                              value={l.weekday}
                              onChange={(e) =>
                                updateLecture(idx, { weekday: Number(e.target.value) })
                              }
                            >
                              {WEEKDAYS.map((d, w) => (
                                <option key={d} value={w}>
                                  {d}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              aria-label="Starttid"
                              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                              value={l.start}
                              onChange={(e) => updateLecture(idx, { start: e.target.value })}
                            />
                            <input
                              type="time"
                              aria-label="Sluttid"
                              className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                              value={l.end}
                              onChange={(e) => updateLecture(idx, { end: e.target.value })}
                            />
                          </div>
                          <input
                            type="text"
                            aria-label="Lektionens namn"
                            maxLength={120}
                            className="mt-2 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                            value={l.title}
                            onChange={(e) =>
                              updateLecture(idx, { title: e.target.value.slice(0, 120) })
                            }
                          />
                          <input
                            type="text"
                            aria-label="Plats"
                            maxLength={80}
                            placeholder="Plats (valfritt)"
                            className="mt-2 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                            value={l.location ?? ""}
                            onChange={(e) =>
                              updateLecture(idx, { location: e.target.value.slice(0, 80) })
                            }
                          />
                          <select
                            aria-label="Typ"
                            className="mt-2 h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                            value={l.kind ?? "lecture"}
                            onChange={(e) =>
                              updateLecture(idx, { kind: e.target.value as LectureKind })
                            }
                          >
                            <option value="lecture">Lektion</option>
                            <option value="break">Rast</option>
                            <option value="lunch">Lunch</option>
                          </select>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => setEditIdx(null)}
                              disabled={!l.title.trim() || !l.start}
                            >
                              Klar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-destructive"
                              onClick={() => removeLecture(idx)}
                            >
                              Ta bort
                            </Button>
                          </div>
                        </li>
                      ) : (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => setEditIdx(idx)}
                            className="flex w-full gap-2 rounded-lg px-1 py-1 text-left hover:bg-muted/60"
                          >
                            <span className="w-24 shrink-0 tabular-nums text-muted-foreground">
                              {l.start}–{l.end}
                            </span>
                            <span className="flex-1">
                              {l.title}
                              {l.location ? ` · ${l.location}` : ""}
                            </span>
                            {l.kind && l.kind !== "lecture" && (
                              <span className="shrink-0 self-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {LECTURE_KIND_LABEL[l.kind]}
                              </span>
                            )}
                            {existingKeys.has(keyOf(l)) && (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                finns redan
                              </span>
                            )}
                            <Pencil className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground" />
                          </button>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
              Steg 3 · Spara
            </p>
            <div className="mt-2 flex gap-2">
              <Button className="rounded-full" onClick={save}>
                <Check className="mr-2 h-4 w-4" /> Spara i schemat
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setPreview([]);
                  setEditIdx(null);
                }}
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <Dialog open={!!viewFile} onOpenChange={(open) => !open && setViewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{viewFile?.name}</DialogTitle>
          </DialogHeader>
          {viewFile &&
            (viewFile.mime.startsWith("image/") ? (
              <img
                src={viewFile.dataUrl}
                alt={`Schemafil: ${viewFile.name}`}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
            ) : (
              <iframe
                src={viewFile.dataUrl}
                title={viewFile.name}
                className="h-[70vh] w-full rounded-2xl border border-border"
              />
            ))}
          {viewFile && (
            <a
              href={viewFile.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Öppna i nytt fönster
            </a>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default ScheduleImport;
