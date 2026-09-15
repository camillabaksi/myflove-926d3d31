import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  title: z.string().min(1).max(300),
  course: z.string().max(200).optional(),
  /** Inklistrad text eller anteckningar */
  text: z.string().max(30000).optional(),
  /** Uppladdad fil som data-URL (PDF eller bild) */
  file: z
    .object({
      name: z.string().max(300),
      mime: z.string().max(120),
      dataUrl: z.string().max(14_000_000),
    })
    .optional(),
  /** Frivillig studieprofil som text – personlig kontext, inte regler. */
  profileContext: z.string().max(2000).optional(),
  /** Anpassning utifrån stödbehov och inlärningspreferenser. */
  focus: z.string().max(1500).optional(),
  cardCount: z.number().int().min(0).max(30).default(12),
  quizCount: z.number().int().min(0).max(20).default(10),
});

const OutputSchema = z.object({
  summary: z.string(),
  topics: z.array(z.string()).default([]),
  cards: z.array(z.object({ front: z.string(), back: z.string(), topic: z.string().optional() })),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number().int(),
      explanation: z.string().optional(),
      topic: z.string().optional(),
    }),
  ),
});

export type StudySet = z.infer<typeof OutputSchema>;

const SYSTEM = `Du är Flow – MyFloves lugna, empatiska studiekompanjon.
Du gör studiematerial till flashcards och quizfrågor.

Regler:
- Skriv på svenska, du-form, inga emojis.
- Flashcards: "front" är en kort fråga eller begrepp, "back" ett tydligt svar på 1–3 meningar.
- Quiz: flervalsfrågor med exakt 4 svarsalternativ, ett rätt. correctIndex är 0-baserat.
- Lägg gärna en kort "explanation" som förklarar varför svaret är rätt.
- "topic" är ett kort ämnesord (t.ex. "Bemötande", "Trauma") så repetition kan riktas.
- "summary" är max 2 meningar om vad materialet handlar om.
- Bygg allt på materialet du fått. Hitta inte på fakta som saknas.
- Om en studieprofil finns: anpassa språk, svårighetsnivå och exempel efter den, utan att anta något som inte står där.
- Svara ENDAST med giltig JSON enligt schemat.`;

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export const generateStudySet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<StudySet> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    if (!data.text?.trim() && !data.file) {
      throw new Error("Lägg till text eller en fil så kan Flow skapa frågor.");
    }

    const instruction = [
      data.profileContext?.trim() ? `${data.profileContext.trim()}\n` : null,
      `Material: ${data.title}`,
      data.course ? `Kurs: ${data.course}` : null,
      "",
      data.cardCount > 0 && data.quizCount > 0
        ? `Skapa ${data.cardCount} flashcards och ${data.quizCount} flervalsfrågor utifrån materialet.`
        : data.cardCount > 0
          ? `Skapa ${data.cardCount} flashcards utifrån materialet. Skapa INGA quizfrågor – returnera quiz som en tom lista.`
          : `Skapa ${data.quizCount} flervalsfrågor utifrån materialet. Skapa INGA flashcards – returnera cards som en tom lista.`,
      data.focus?.trim() ? `Anpassning efter användarens stödbehov: ${data.focus.trim()}` : null,
      "Returnera JSON: { summary, topics: [string], cards: [{ front, back, topic }], quiz: [{ question, options: [4 st], correctIndex, explanation, topic }] }.",

      data.text?.trim() ? `\nMaterial (text):\n${data.text.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const content: ContentBlock[] = [{ type: "text", text: instruction }];
    if (data.file) {
      if (data.file.mime.startsWith("image/")) {
        content.push({ type: "image_url", image_url: { url: data.file.dataUrl } });
      } else {
        content.push({
          type: "file",
          file: { filename: data.file.name, file_data: data.file.dataUrl },
        });
      }
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

    if (res.status === 429)
      throw new Response("För många frågor just nu. Prova igen om en stund.", { status: 429 });
    if (res.status === 402) throw new Response("AI-krediterna är slut.", { status: 402 });
    if (!res.ok) throw new Error(`AI-fel: ${res.status} ${await res.text()}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let parsed: unknown;
    try {
      parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      throw new Error("AI:n svarade i fel format.");
    }

    const result = OutputSchema.parse(parsed);
    return {
      summary: result.summary,
      topics: result.topics.slice(0, 12),
      cards: result.cards.slice(0, 30),
      quiz: result.quiz
        .filter(
          (q) => q.options.length >= 2 && q.correctIndex >= 0 && q.correctIndex < q.options.length,
        )
        .slice(0, 20),
    };
  });
