import { useRef, useState } from "react";
import { Upload, Sparkles, FileUp, Check, CalendarCheck, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { WEEKDAYS } from "@/lib/study-calendar";
import {
  dedupe,
  parseScheduleIcs,
  parseScheduleText,
  type ParsedLecture,
} from "@/lib/schedule-parse";
import { parseScheduleWithFlow } from "@/lib/schedule-import.functions";
import CollapsibleSection from "@/components/collapsible-section";
import { ACCEPT_SCHEDULE, isTextFile, readFileAsText } from "@/lib/file-formats";

const card = "rounded-3xl border border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

export function ScheduleImport() {
  const { lectures, addLecture } = useStudySchedule();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedLecture[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const goToSchedule = () => {
    const el = document.getElementById("veckoschema");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const show = (found: ParsedLecture[]) => {
    if (!found.length) {
      toast.error('Hittade inga lektioner – prova "Låt Flow tolka" istället.');
      return;
    }
    setPreview(found);
    toast.success(`Hittade ${found.length} lektioner – granska och spara 💙`);
  };

  const handleFile = async (file: File) => {
    if (!isTextFile(file)) {
      toast.error(
        "Den filtypen kan inte läsas direkt. Spara schemat som .ics, .txt, .csv eller klistra in texten.",
      );
      return;
    }
    const content = await readFileAsText(file, 20000);
    const isIcs = /BEGIN:VCALENDAR/i.test(content) || file.name.toLowerCase().endsWith(".ics");
    setText(isIcs ? "" : content);
    show(isIcs ? parseScheduleIcs(content) : parseScheduleText(content));
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
          Klistra in schemat som text eller ladda upp en fil (.ics, .txt, .csv, .md, .json, .html) från skolan. Flow gör om det till
          ditt veckoschema – sen kan Flow säga vilken lektion som är nästa och var.
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
          >
            <FileUp className="mr-2 h-4 w-4" /> Ladda upp fil
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

        {preview.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Förhandsvisning – granska innan du sparar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.length} lektioner tolkade
              {newCount !== preview.length ? ` · ${newCount} nya, ${preview.length - newCount} finns redan` : ""}
            </p>
            <div className="mt-3 space-y-3">
              {grouped.map(({ weekday, items }) => (
                <div key={weekday}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {WEEKDAYS[weekday]}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-ink">
                    {items.map((l, i) => (
                      <li key={`${l.weekday}-${l.start}-${i}`} className="flex gap-2">
                        <span className="w-24 shrink-0 tabular-nums text-muted-foreground">
                          {l.start}–{l.end}
                        </span>
                        <span className="flex-1">
                          {l.title}
                          {l.location ? ` · ${l.location}` : ""}
                        </span>
                        {existingKeys.has(keyOf(l)) && (
                          <span className="shrink-0 text-xs text-muted-foreground">finns redan</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Button className="rounded-full" onClick={save}>
                <Check className="mr-2 h-4 w-4" /> Spara i schemat
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setPreview([])}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </CollapsibleSection>
    </section>
  );
}

export default ScheduleImport;
