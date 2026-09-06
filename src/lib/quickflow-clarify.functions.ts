import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  /** Batterinivå 0–100 om den finns. */
  energyPercent: z.number().min(0).max(100).optional(),
  /** Dagens påverkan/menscykel som bakgrund – aldrig diagnos. */
  context: z.string().max(1500).optional(),
});

const OutputSchema = z.object({
  /** Kort förklaring av varför saken är värd att göra. */
  why: z.string(),
  /** Hur mycket energi den troligen kräver. */
  energyLevel: z.enum(["liten", "medel", "stor"]),
  /** En mening om energin, anpassad efter batteriet. */
  energyNote: z.string(),
  /** Ett litet första steg för att komma igång. */
  firstStep: z.string(),
});

export type QuickflowClarifyResult = z.infer<typeof OutputSchema>;

const SYSTEM = `Du är Flow – MyFloves lugna, NPF-vänliga kompanjon.
Användaren har en uppgift och vill förstå den bättre innan hen börjar.

Förtydliga uppgiften på samma varma sätt som du pratar om energi och mående:
- "why": varför saken kan vara värd att göra, max 18 ord.
- "energyLevel": "liten", "medel" eller "stor" – en uppskattning av energin den kräver.
- "energyNote": en mening om energin i relation till användarens batteri, max 18 ord.
- "firstStep": ett litet, konkret första steg, max 12 ord.

Regler:
- Hitta ALDRIG på deadlines, tider eller datum.
- Säg aldrig att användaren måste något. Aldrig dömande, aldrig peppig-överdriven.
- Svara ENDAST med giltig JSON: { why, energyLevel, energyNote, firstStep }.`;

export const clarifyQuickflowTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<QuickflowClarifyResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = [
      typeof data.energyPercent === "number"
        ? `Energinivå just nu: ${Math.round(data.energyPercent)}/100`
        : "Energinivå: okänd",
      ...(data.context ? ["", data.context] : []),
      "",
      `Uppgift: ${data.title}`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (res.status === 429) throw new Response("För många frågor just nu.", { status: 429 });
    if (res.status === 402) throw new Response("AI-krediterna är slut.", { status: 402 });
    if (!res.ok) throw new Error(`AI-fel: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let parsed: unknown;
    try {
      parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      throw new Error("AI:n svarade i fel format.");
    }
    return OutputSchema.parse(parsed);
  });
