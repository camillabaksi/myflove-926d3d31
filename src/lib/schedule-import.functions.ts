import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({ text: z.string().min(3).max(8000) });

const LectureSchema = z.object({
  title: z.string().min(1).max(120),
  weekday: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().max(60).optional(),
});

export type ParsedScheduleLecture = z.infer<typeof LectureSchema>;

const SYSTEM = `Du är Flow – MyFloves lugna AI-kompanjon.
Du tolkar ett studieschema som användaren klistrat in och gör om det till strukturerad data.

Regler:
- weekday: 0 = måndag … 6 = söndag.
- start/end i formatet HH:MM (24h). Saknas sluttid: lägg till 60 minuter.
- title: kort namn på lektionen/kursen, utan tid eller sal.
- location: sal/rum/plats om det finns, annars utelämna.
- Ta bara med återkommande lektioner/föreläsningar, inte raster.
- Svara ENDAST med JSON: { "lectures": [{ "title", "weekday", "start", "end", "location" }] }`;

export const parseScheduleWithFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ lectures: ParsedScheduleLecture[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.text },
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
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { lectures?: unknown };
      const lectures = z.array(LectureSchema).safeParse(parsed.lectures ?? []);
      return { lectures: lectures.success ? lectures.data : [] };
    } catch {
      return { lectures: [] };
    }
  });
