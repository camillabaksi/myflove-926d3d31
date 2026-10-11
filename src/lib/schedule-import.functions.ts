import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FileSchema = z.object({
  name: z.string().max(200),
  mime: z.string().max(100),
  dataUrl: z.string().min(20).max(8_000_000),
});

const InputSchema = z
  .object({
    text: z.string().max(8000).optional(),
    file: FileSchema.optional(),
  })
  .refine((v) => (v.text && v.text.trim().length >= 3) || v.file, {
    message: "Ange text eller en fil",
  });

const LectureSchema = z.object({
  title: z.string().min(1).max(120),
  weekday: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().max(60).optional(),
  kind: z.enum(["lecture", "break", "lunch"]).optional(),
});

export type ParsedScheduleLecture = z.infer<typeof LectureSchema>;

const SYSTEM = `Du är Pace – Paceables lugna AI-kompanjon.
Du tolkar ett studieschema som användaren klistrat in, fotograferat eller laddat upp och gör om det till strukturerad data.

Regler:
- Om du får en bild eller PDF: läs av all text i schemat noggrant (även tabeller och kolumner med veckodagar).
- weekday: 0 = måndag … 6 = söndag.
- start/end i formatet HH:MM (24h). Saknas sluttid: lägg till 60 minuter.
- title: kort namn på lektionen/kursen, utan tid eller sal.
- location: sal/rum/plats om det finns, annars utelämna.
- Ta med återkommande lektioner/föreläsningar OCH raster och lunch – de är viktiga hållpunkter.
- kind: "lecture" för lektioner, "break" för rast/paus, "lunch" för lunch. Sätt alltid kind.
- Svara ENDAST med JSON: { "lectures": [{ "title", "weekday", "start", "end", "location", "kind" }] }`;

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export const parseScheduleWithFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ lectures: ParsedScheduleLecture[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const content: Part[] = [];
    if (data.text?.trim()) content.push({ type: "text", text: data.text });
    if (data.file) {
      content.push({
        type: "text",
        text: `Bifogad schemafil: ${data.file.name}. Läs av schemat i filen.`,
      });
      content.push({ type: "image_url", image_url: { url: data.file.dataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      return { lectures: [] };
    }

    try {
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "");
      const parsed = JSON.parse(cleaned) as { lectures?: unknown };
      const lectures = z.array(LectureSchema).safeParse(parsed.lectures ?? []);
      return { lectures: lectures.success ? lectures.data : [] };
    } catch {
      return { lectures: [] };
    }
  });
