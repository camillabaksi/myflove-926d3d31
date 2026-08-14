import { useRef, useState } from "react";
import { Upload, Sparkles, FileUp, Check } from "lucide-react";
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

const card = "rounded-3xl border border-border bg-card p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 font-display text-lg text-ink";

export function ScheduleImport() {
  const { lectures, addLecture } = useStudySchedule();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedLecture[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const show = (found: ParsedLecture[]) => {
    if (!found.length) {
      toast.error("Hittade inga lektioner – prova \"Låt Flow tolka\" istället.");
      return;
    }
    setPreview(found);
    toast.success(`Hittade ${found.length} lektioner – granska och spara 💙`);
  };

  const handleFile = async (file: File) => {
    const content = await file.text();
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
    toast.success(added ? `${added} lektioner ligger nu i ditt schema` : "Allt fanns redan 💙");
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}>
        <Upload className="h-5 w-5 text-primary" /> Ladda upp ditt schema
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Klistra in schemat som text eller ladda upp en .ics-fil från skolan. Flow gör om det till
        ditt veckoschema – sen kan Flow säga vilken lektion som är nästa och var.
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
        >
          <FileUp className="mr-2 h-4 w-4" /> Ladda upp fil
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".ics,.txt,.csv,text/calendar,text/plain"
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
            Granska innan du sparar
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {preview.map((l, i) => (
              <li key={`${l.weekday}-${l.start}-${i}`} className="flex gap-2">
                <span className="w-10 shrink-0 text-muted-foreground">{WEEKDAYS[l.weekday]}</span>
                <span className="w-24 shrink-0 text-muted-foreground">
                  {l.start}–{l.end}
                </span>
                <span className="flex-1">
                  {l.title}
                  {l.location ? ` · ${l.location}` : ""}
                </span>
              </li>
            ))}
          </ul>
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
    </section>
  );
}

export default ScheduleImport;
