import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRIORITY_DEFINITIONS, normalizeBucket } from "@/lib/priority-engine";

const InputSchema = z.object({
  titles: z.array(z.string().min(1).max(200)).min(1).max(20),
  /** Batterinivå 0–100 om den finns. */
  energyPercent: z.number().min(0).max(100).optional(),
  /** Dagens påverkan/menscykel som bakgrund – aldrig diagnos. */
  context: z.string().max(1500).optional(),
});

const OutputSchema = z.object({
  intro: z.string(),
  items: z.array(
    z.object({
      title: z.string(),
      bucket: z.enum(["nu", "sedan", "om-du-orkar", "kan-vanta"]),
      why: z.string(),
    }),
  ),
});

export type QuickflowPriorityResult = z.infer<typeof OutputSchema>;

const SYSTEM = `Du är Flow – MyFloves lugna, NPF-vänliga kompanjon.
Användaren har många saker på en gång och vill INTE planera tider.

Sortera sakerna i MyFloves fyra prioritetsnivåer:
- "nu" = P1. ${PRIORITY_DEFINITIONS[1]}
- "sedan" = P2. ${PRIORITY_DEFINITIONS[2]}
- "kan-vanta" = P3. ${PRIORITY_DEFINITIONS[3]}
- "om-du-orkar" = P4. ${PRIORITY_DEFINITIONS[4]}
Prioritet beskriver konsekvens och sammanhang – inte användarens ork.

Regler:
- Hitta ALDRIG på deadlines, tider eller datum. Nämn bara deadline om användaren skrivit den.
- Säg aldrig att användaren måste något. Ton: varm, kort, aldrig dömande.
- Kapacitet ändrar aldrig prioritet; ordna inom samma nivå så små steg kommer först vid låg ork.
- "why" är max 12 ord. "intro" är en mening, max 20 ord.
- Behåll varje titel exakt som användaren skrev den.
- Svara ENDAST med giltig JSON: { intro, items: [{ title, bucket, why }] }.`;

export const prioritizeQuickflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<QuickflowPriorityResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = [
      typeof data.energyPercent === "number"
        ? `Energinivå just nu: ${Math.round(data.energyPercent)}/100`
        : "Energinivå: okänd",
      ...(data.context ? ["", data.context] : []),
      "",
      "Saker användaren behöver få gjort:",
      ...data.titles.map((t) => `- ${t}`),
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
    const out = OutputSchema.parse(parsed);
    return { ...out, items: out.items.map((i) => ({ ...i, bucket: normalizeBucket(i.bucket) })) };
  });
