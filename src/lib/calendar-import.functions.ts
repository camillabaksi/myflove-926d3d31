import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * QuickFlow → Importera från bild: Flow läser en bild/PDF/text och
 * plockar ut kalenderrelaterad information. Hittar aldrig på värden.
 */

const InputSchema = z
  .object({
    today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekday: z.string().max(20),
    text: z.string().max(30000).optional(),
    file: z
      .object({
        name: z.string().max(200),
        mime: z.string().max(100),
        dataUrl: z.string().min(20).max(14_000_000),
      })
      .optional(),
  })
  .refine((v) => (v.text && v.text.trim().length > 0) || v.file, {
    message: "Ingen fil eller text",
  });

export type ImportKind = "calendar" | "reminder" | "note" | "task" | "idea";

export interface ImportedItem {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address: string;
  meeting_url: string;
  contact: string;
  notes: string;
  action_required: string;
  suggested_reminder: string;
  event_type: string;
  suggested_kind: ImportKind;
  date_question: string;
  confidence: { title: number; date: number; time: number; location: number };
}

export interface ImportResult {
  status: "ok" | "empty" | "unreadable" | "error";
  items: ImportedItem[];
  message?: string;
}


const system = (today: string, weekday: string) => `Du är Flow i appen MyFlove. Du läser en bild, ett foto, en screenshot, en PDF eller text och hittar ALLT som kan höra hemma i en kalender.
Dagens datum är ${today} (${weekday}). Tolka relativa uttryck ("nästa torsdag", "imorgon") utifrån det.

Absoluta regler:
- Hitta ALDRIG på datum, tider, länkar, platser eller annat som inte står i källan. Saknas något: tom sträng "".
- Om datum är tvetydigt (t.ex. "10/10" utan år och oklart format, eller veckodag som inte går ihop med datumet) – lämna date tomt och skriv en kort fråga i date_question, t.ex. "Vilket datum menas med Fredag 10/10?".
- Ett återkommande veckoschema: skapa en post per tillfälle för den kommande veckan med riktiga datum om veckodagar framgår.
- Varje separat händelse = en egen post. Hitta alla.
- date: YYYY-MM-DD. start_time/end_time: HH:MM 24h. Deadline utan klockslag ("senast 12 oktober"): date satt, start_time tomt, suggested_kind "task". "kl 23:59" som deadline får start_time 23:59.
- Formuleringar som "glöm inte", "kom ihåg", "ta med", "förbered", "deadline", "senast", "skicka innan", "anmäl dig senast" → lägg i action_required. Föreslå suggested_reminder (t.ex. "30 min innan", "1 dag innan") bara om det passar, annars "".
- meeting_url: Zoom/Teams/Google Meet eller annan möteslänk exakt som den står. location kan då vara "Zoom", "Teams" eller "Google Meet".
- suggested_kind: "calendar" om det finns ett tydligt datum OCH klockslag för en händelse; "task" för deadlines/saker att göra utan klockslag; "reminder" för "kom ihåg"-saker utan händelse; "note" för allmän info; "idea" för idéer.
- event_type: kort typ, t.ex. "möte", "lektion", "deadline", "tandläkare", "övrigt".
- confidence: 0–1 per fält (title, date, time, location). Sätt lågt (<0.7) när du är osäker eller texten är svårläst. 0 om fältet är tomt.
- title: kort och tydlig, på källans språk, utan datum/tid.
- readable: false om bilden är för suddig/oläslig att tolka.
Svara endast enligt JSON-schemat.`;

type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function readOutputText(res: Response): Promise<string> {
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  return (json.choices?.[0]?.message?.content ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "");
}

const clampConf = (n: unknown) => (typeof n === "number" && n >= 0 && n <= 1 ? n : 0);
const s = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const KINDS: ImportKind[] = ["calendar", "reminder", "note", "task", "idea"];

function sanitize(raw: unknown): ImportedItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s(r.date)) ? s(r.date) : "";
  const time = (v: unknown) => (/^\d{2}:\d{2}$/.test(s(v)) ? s(v) : "");
  const url = s(r.meeting_url, 1000);
  const c = (r.confidence ?? {}) as Record<string, unknown>;
  const kind = KINDS.includes(r.suggested_kind as ImportKind)
    ? (r.suggested_kind as ImportKind)
    : "note";
  const title = s(r.title, 200);
  if (!title && !s(r.notes)) return null;
  return {
    title: title || s(r.notes, 80),
    date,
    start_time: time(r.start_time),
    end_time: time(r.end_time),
    location: s(r.location, 200),
    address: s(r.address, 300),
    meeting_url: /^https?:\/\//i.test(url) ? url : "",
    contact: s(r.contact, 200),
    notes: s(r.notes, 1500),
    action_required: s(r.action_required, 500),
    suggested_reminder: s(r.suggested_reminder, 60),
    event_type: s(r.event_type, 40),
    suggested_kind: kind,
    date_question: s(r.date_question, 200),
    confidence: {
      title: clampConf(c.title),
      date: clampConf(c.date),
      time: clampConf(c.time),
      location: clampConf(c.location),
    },
  };
}

export const analyzeCalendarImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ImportResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { status: "error", items: [], message: "AI är inte konfigurerat." };

    const content: ChatContent[] = [];
    if (data.text?.trim()) content.push({ type: "text", text: data.text });
    if (data.file) {
      content.push({ type: "text", text: `Bifogad fil: ${data.file.name}` });
      content.push({ type: "image_url", image_url: { url: data.file.dataUrl } });
    }

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            { role: "system", content: system(data.today, data.weekday) },
            { role: "user", content },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      return { status: "error", items: [], message: "Kunde inte nå Flow just nu." };
    }

    if (!res.ok) {
      const message =
        res.status === 429
          ? "Flow har mycket att göra just nu. Vänta en stund och försök igen."
          : res.status === 402
            ? "AI-krediterna är slut för tillfället."
            : res.status === 400
              ? "Flow kunde inte läsa filen. Prova en annan bild eller PDF."
              : "Något gick fel när Flow läste filen.";
      console.error("calendar-import gateway", res.status, await res.text().catch(() => ""));
      return { status: "error", items: [], message };
    }

    try {
      const raw = await readOutputText(res);
      const parsed = JSON.parse(raw) as
        | { readable?: boolean; items?: unknown[] }
        | unknown[];
      // Gemini svarar ibland med en ren lista i stället för { items: [...] }.
      const rawItems = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
      const readable = Array.isArray(parsed) ? undefined : parsed.readable;
      const items = rawItems.map(sanitize).filter((i): i is ImportedItem => !!i);
      if (readable === false && items.length === 0) return { status: "unreadable", items };
      return { status: items.length ? "ok" : "empty", items: items.slice(0, 40) };
    } catch (error) {
      if (error instanceof Error && error.message === "refused") {
        return { status: "error", items: [], message: "Flow kan inte tolka den här filen." };
      }
      return { status: "error", items: [], message: "Flow fick ett otydligt svar. Försök igen." };
    }
  });
