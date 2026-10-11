import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  title: z.string().min(1).max(300),
  course: z.string().max(200).optional(),
  dueDate: z.string().max(20).optional(),
  details: z.string().max(4000).optional(),
  /** Frivillig studieprofil som text – personlig kontext, inte regler. */
  profileContext: z.string().max(2000).optional(),
});

const OutputSchema = z.object({
  intro: z.string(),
  steps: z.array(z.object({ title: z.string(), when: z.string().optional() })),
  startBy: z.string().optional(),
  note: z.string(),
});

export type StudyBreakdown = z.infer<typeof OutputSchema>;

const SYSTEM = `Du är Pace – Paceables lugna, empatiska AI-kompanjon.
Din uppgift här är att dela upp en skoluppgift eller inlämning i små, konkreta steg.

Regler:
- Max 6 steg. Varje steg ska gå att börja på direkt, formulerat som en handling ("Läs instruktionen", "Samla material").
- Om deadline finns: föreslå ett "startBy"-datum (YYYY-MM-DD) som ger marginal.
- "when" är valfritt och kort, t.ex. "senast 12 sep" – hoppa över om det inte tillför något.
- "intro" är en mening (max 20 ord) som möter användaren där hen är.
- "note" avlastar, t.ex. "Du behöver inte göra allt idag."
- Aldrig dömande eller stressande. Svenska, du-form, inga emojis.
- Om en studieprofil finns: anpassa språk, stegens storlek och exempel efter den, utan att anta något som inte står där.
- Svara ENDAST med giltig JSON enligt schemat.`;

export const breakDownAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<StudyBreakdown> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = [
      data.profileContext?.trim() ? `${data.profileContext.trim()}\n` : null,
      `Uppgift: ${data.title}`,
      data.course ? `Kurs: ${data.course}` : null,
      data.dueDate ? `Deadline: ${data.dueDate}` : null,
      data.details ? `Detaljer: ${data.details}` : null,
      `Dagens datum: ${new Date().toISOString().split("T")[0]}`,
      "",
      "Returnera JSON: { intro, steps: [{ title, when }], startBy, note }.",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (res.status === 429) throw new Response("För många frågor just nu.", { status: 429 });
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
    return { ...result, steps: result.steps.slice(0, 6) };
  });
