import { useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  ScanLine,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks, useReminders, useDumpIdeas } from "@/hooks/use-data";
import { useNotes } from "@/hooks/use-notes";
import { todayISO } from "@/lib/day";
import { prepareUpload, isImageFile, isPdfFile, ACCEPT_DOCUMENTS } from "@/lib/file-formats";
import {
  analyzeCalendarImport,
  type ImportKind,
  type ImportedItem,
} from "@/lib/calendar-import.functions";

type Stage = "pick" | "busy" | "review" | "empty" | "unreadable" | "done";

interface Draft extends ImportedItem {
  key: string;
  selected: boolean;
  kind: ImportKind;
  reminderMin: number | null;
  /** null = ingen dubblett, "ask" = fråga, "keep" = behåll båda */
  dup: null | "ask" | "keep";
}

const KIND_META: Record<ImportKind, { label: string; emoji: string }> = {
  calendar: { label: "Kalender", emoji: "📅" },
  reminder: { label: "Påminnelse", emoji: "🔔" },
  note: { label: "Anteckning", emoji: "📝" },
  task: { label: "Uppgift", emoji: "✅" },
  idea: { label: "Idé", emoji: "💡" },
};

const REMINDER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Ingen", value: null },
  { label: "Vid start", value: 0 },
  { label: "15 min innan", value: 15 },
  { label: "30 min innan", value: 30 },
  { label: "1 tim innan", value: 60 },
  { label: "1 dag innan", value: 1440 },
];

const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

function reminderFromText(text: string): number | null {
  const t = text.toLowerCase();
  if (!t) return null;
  const m = t.match(/(\d+)\s*(min|tim|h|dag)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2].startsWith("dag")) return n * 1440;
  if (m[2].startsWith("tim") || m[2] === "h") return n * 60;
  return n;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-zåäö0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function similar(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "long" });
}

const LOW = 0.7;

export function QuickflowImageImport() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("pick");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("bild");
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const { tasks, addTask } = useTasks();
  const { reminders, addReminder } = useReminders();
  const { addNote } = useNotes();
  const { addIdea } = useDumpIdeas();

  const reset = () => {
    setStage("pick");
    setDrafts([]);
    setEditKey(null);
    setErrorMsg(null);
    setLastFile(null);
  };

  const findDuplicate = (d: Pick<Draft, "title" | "date" | "start_time">) => {
    if (!d.date) return false;
    const t = tasks.some(
      (x) =>
        x.dueDate === d.date &&
        (x.time ?? "") === d.start_time &&
        similar(x.title, d.title),
    );
    const r = reminders.some(
      (x) => x.date === d.date && (x.time ?? "") === d.start_time && similar(x.title, d.title),
    );
    return t || r;
  };

  const analyze = async (file: File) => {
    setLastFile(file);
    setErrorMsg(null);
    setStage("busy");
    setSourceLabel(isPdfFile(file) ? "PDF" : isImageFile(file) ? "bild" : "dokument");
    try {
      const prepared = await prepareUpload(file);
      const now = new Date();
      const res = await analyzeCalendarImport({
        data: {
          today: todayISO(now),
          weekday: WEEKDAYS[now.getDay()],
          ...(prepared.kind === "file" ? { file: prepared.file } : { text: prepared.text }),
        },
      });
      if (res.status === "error") {
        setErrorMsg(res.message ?? "Något gick fel.");
        setStage("pick");
        return;
      }
      if (res.status === "unreadable") return setStage("unreadable");
      if (res.status === "empty") return setStage("empty");
      setDrafts(
        res.items.map((it, i) => {
          // Utan klockslag/datum blir det aldrig en kalenderhändelse med påhittad tid.
          const kind: ImportKind =
            it.suggested_kind === "calendar" && !it.start_time
              ? it.date
                ? "task"
                : "reminder"
              : it.suggested_kind;
          return {
            ...it,
            key: `${i}-${it.title}`,
            kind,
            selected: true,
            reminderMin: null,
            dup: findDuplicate(it) ? "ask" : null,
          };
        }),
      );
      setStage("review");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Kunde inte läsa filen.");
      setStage("pick");
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setOpen(true);
    void analyze(f);
  };

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const next = { ...d, ...patch };
        if ("title" in patch || "date" in patch || "start_time" in patch) {
          next.dup = findDuplicate(next) ? (d.dup === "keep" ? "keep" : "ask") : null;
        }
        return next;
      }),
    );

  const buildNote = (d: Draft) =>
    [
      d.notes,
      d.action_required && `📝 ${d.action_required}`,
      d.location && `📍 ${d.location}`,
      d.address && d.address !== d.location ? d.address : "",
      d.contact && `👤 ${d.contact}`,
      d.meeting_url,
      `Källa: Importerad från ${sourceLabel}`,
    ]
      .filter(Boolean)
      .join("\n");

  const needsDate = (d: Draft) => (d.kind === "calendar" || d.kind === "reminder") && !d.date;

  const selected = drafts.filter((d) => d.selected);
  const blocked = selected.some((d) => needsDate(d) || d.dup === "ask");

  const save = () => {
    let count = 0;
    for (const d of selected) {
      const title = d.title.trim();
      if (!title) continue;
      const note = buildNote(d);
      if (d.kind === "calendar") {
        addTask(title, d.date, {
          time: d.start_time || undefined,
          endTime: d.end_time || undefined,
          note,
          ...(d.reminderMin !== null && d.start_time ? { reminderMinutesBefore: d.reminderMin } : {}),
        });
      } else if (d.kind === "task") {
        addTask(title, d.date || undefined, { note });
      } else if (d.kind === "reminder") {
        addReminder(
          title,
          d.date,
          d.start_time || undefined,
          "none",
          d.end_time || undefined,
          d.reminderMin ?? undefined,
          note,
        );
      } else if (d.kind === "note") {
        addNote(`${title}\n${note}`);
      } else {
        addIdea(`${title}${d.notes ? ` – ${d.notes}` : ""}`);
      }
      count++;
    }
    setSavedCount(count);
    setStage("done");
    toast.success(`Klart! ✨ ${count} ${count === 1 ? "sak är" : "saker är"} nu inlagda.`);
  };

  const saveFileAsNote = () => {
    addNote(`Importerad ${sourceLabel}: ${lastFile?.name ?? ""}`.trim());
    toast.success("Sparad som anteckning. 📝");
    setOpen(false);
    reset();
  };

  return (
    <>
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ScanLine size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Importera till kalendern</span>
            <span className="block text-sm text-muted-foreground">
              Bild, screenshot, PDF eller dokument → Flow hittar möten och deadlines.
            </span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-ink hover:border-primary/50 active:scale-[0.98]"
          >
            <ImageIcon size={18} className="text-primary" /> Bild
          </button>
          <button
            type="button"
            onClick={() => docRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-ink hover:border-primary/50 active:scale-[0.98]"
          >
            <FileText size={18} className="text-primary" /> PDF / dokument
          </button>
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={imageRef} type="file" accept="image/*,.heic,.heif" hidden onChange={onPick} />
      <input ref={docRef} type="file" accept={ACCEPT_DOCUMENTS} hidden onChange={onPick} />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[88dvh] max-w-[640px] overflow-y-auto overflow-x-hidden rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-ink">
              {stage === "review"
                ? `Flow hittade ${drafts.length} ${drafts.length === 1 ? "sak" : "saker"} 👀`
                : stage === "done"
                  ? "Klart! ✨"
                  : "Importera till kalendern"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {stage === "review"
                ? "Kolla så att allt ser rätt ut innan jag lägger in dem."
                : stage === "done"
                  ? `${savedCount} ${savedCount === 1 ? "sak är" : "saker är"} nu inlagda i din kalender.`
                  : "Skicka hit en bild eller ett dokument så kollar jag vad som behöver in i din kalender 👀"}
            </p>
          </DialogHeader>

          {stage === "pick" && (
            <div className="space-y-3">
              {errorMsg && (
                <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{errorMsg}</p>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { icon: Camera, label: "📷 Ta foto", ref: cameraRef },
                  { icon: ImageIcon, label: "🖼️ Välj bild", ref: imageRef },
                  { icon: FileText, label: "📄 Dokument/PDF", ref: docRef },
                ].map(({ icon: Icon, label, ref }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => ref.current?.click()}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left font-medium text-ink hover:border-primary/50 sm:flex-col sm:text-center"
                  >
                    <Icon size={22} className="text-primary" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Filen används bara för att läsa av innehållet och sparas inte.
              </p>
            </div>
          )}

          {stage === "busy" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm text-muted-foreground">Flow läser av {sourceLabel}en…</p>
            </div>
          )}

          {(stage === "empty" || stage === "unreadable") && (
            <div className="space-y-4">
              <p className="rounded-2xl bg-secondary p-4 text-sm text-ink">
                {stage === "empty"
                  ? "Hmm... jag hittade inget tydligt datum eller någon tid i den här bilden. Vill du spara den som en vanlig QuickFlow-anteckning istället?"
                  : "Jag har svårt att läsa bilden. Testa gärna med en tydligare bild."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {stage === "empty" && (
                  <Button onClick={saveFileAsNote} className="rounded-xl sm:flex-1">
                    Spara som anteckning
                  </Button>
                )}
                <Button variant="outline" onClick={reset} className="rounded-xl sm:flex-1">
                  Försök igen
                </Button>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="min-w-0 space-y-3">
              {drafts.map((d) => {
                const editing = editKey === d.key;
                const lowDate = d.date && d.confidence.date < LOW;
                const lowTime = d.start_time && d.confidence.time < LOW;
                return (
                  <div
                    key={d.key}
                    className={`rounded-2xl border p-3 transition-colors ${d.selected ? "border-primary/40 bg-card" : "border-border bg-muted/40 opacity-70"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={d.selected}
                        onChange={(e) => update(d.key, { selected: e.target.checked })}
                        aria-label={`Välj ${d.title}`}
                        className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setEditKey(editing ? null : d.key)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block font-semibold text-ink">
                          {KIND_META[d.kind].emoji} {d.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {d.date ? formatDate(d.date) : "Inget datum"}
                          {d.start_time && ` · ${d.start_time}${d.end_time ? `–${d.end_time}` : ""}`}
                        </span>
                        {d.location && (
                          <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin size={14} /> {d.location}
                          </span>
                        )}
                        {d.meeting_url && (
                          <span className="mt-0.5 flex items-center gap-1 text-sm text-primary">
                            <Link2 size={14} /> Möteslänk hittad
                          </span>
                        )}
                        {d.action_required && (
                          <span className="mt-0.5 block text-sm text-ink">📝 {d.action_required}</span>
                        )}
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setEditKey(editing ? null : d.key)}
                          aria-label="Redigera"
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrafts((p) => p.filter((x) => x.key !== d.key))}
                          aria-label="Ta bort"
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {(lowDate || lowTime || d.date_question || needsDate(d)) && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-accent/30 p-2 text-sm text-ink">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        {d.date_question ||
                          (needsDate(d)
                            ? "Välj ett datum innan den läggs in."
                            : lowDate
                              ? "Kontrollera datum"
                              : "Kontrollera tid")}
                      </p>
                    )}

                    {d.dup === "ask" && d.selected && (
                      <div className="mt-2 rounded-xl bg-accent/30 p-2 text-sm text-ink">
                        <p>⚠️ Den här händelsen verkar redan finnas i din kalender.</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => update(d.key, { dup: "keep" })}>
                            Behålla båda
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => update(d.key, { selected: false })}>
                            Hoppa över
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(Object.keys(KIND_META) as ImportKind[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => update(d.key, { kind: k })}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${d.kind === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                        >
                          {KIND_META[k].emoji} {KIND_META[k].label}
                        </button>
                      ))}
                    </div>

                    {editing && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="text-xs text-muted-foreground sm:col-span-2">
                          Titel
                          <Input value={d.title} onChange={(e) => update(d.key, { title: e.target.value })} />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Datum
                          <Input type="date" value={d.date} onChange={(e) => update(d.key, { date: e.target.value, date_question: "" })} />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs text-muted-foreground">
                            Start
                            <Input type="time" value={d.start_time} onChange={(e) => update(d.key, { start_time: e.target.value })} />
                          </label>
                          <label className="text-xs text-muted-foreground">
                            Slut
                            <Input type="time" value={d.end_time} onChange={(e) => update(d.key, { end_time: e.target.value })} />
                          </label>
                        </div>
                        <label className="text-xs text-muted-foreground">
                          Plats
                          <Input value={d.location} onChange={(e) => update(d.key, { location: e.target.value })} />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Länk
                          <Input type="url" value={d.meeting_url} onChange={(e) => update(d.key, { meeting_url: e.target.value })} />
                        </label>
                        <label className="text-xs text-muted-foreground sm:col-span-2">
                          Anteckningar
                          <textarea
                            value={d.notes}
                            onChange={(e) => update(d.key, { notes: e.target.value })}
                            rows={2}
                            className="w-full rounded-xl border border-border bg-background p-2 text-sm text-ink"
                          />
                        </label>
                        {(d.kind === "calendar" || d.kind === "reminder") && (
                          <div className="text-xs text-muted-foreground sm:col-span-2">
                            ⏰ Påminn mig
                            {d.suggested_reminder && ` (Flow föreslår: ${d.suggested_reminder})`}
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {REMINDER_OPTIONS.map((o) => (
                                <button
                                  key={o.label}
                                  type="button"
                                  onClick={() => update(d.key, { reminderMin: o.value })}
                                  className={`rounded-full px-2.5 py-1 text-xs ${d.reminderMin === o.value ? "bg-primary text-primary-foreground" : "bg-secondary text-ink"}`}
                                >
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!editing && d.suggested_reminder && d.reminderMin === null && (d.kind === "calendar" || d.kind === "reminder") && (
                      <button
                        type="button"
                        onClick={() => update(d.key, { reminderMin: reminderFromText(d.suggested_reminder) ?? 30 })}
                        className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
                      >
                        ⏰ Påminn mig {d.suggested_reminder}?
                      </button>
                    )}
                    {!editing && d.reminderMin !== null && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        ⏰ {REMINDER_OPTIONS.find((o) => o.value === d.reminderMin)?.label ?? `${d.reminderMin} min innan`}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 bg-background/95 px-1 pt-2 sm:flex-row">
                <Button
                  onClick={save}
                  disabled={selected.length === 0 || blocked}
                  className="rounded-xl sm:flex-1"
                >
                  {selected.length === drafts.length ? "☑ Lägg till alla" : `Lägg till markerade (${selected.length})`}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="rounded-xl sm:flex-1" onClick={reset}>
                Importera en till
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Stäng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickflowImageImport;
