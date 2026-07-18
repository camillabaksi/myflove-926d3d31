import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().optional(),
});

const InputSchema = z.object({
  tasks: z.array(TaskSchema).min(1).max(20),
  energy: z.enum(["low", "medium", "high"]),
  focus: z.string().optional(),
  timeAvailableMin: z.number().int().min(15).max(720).optional(),
});

const PlanItemSchema = z.object({
  taskId: z.string(),
  order: z.number(),
  estimatedMin: z.number(),
  why: z.string(),
});

const OutputSchema = z.object({
  intro: z.string(),
  plan: z.array(PlanItemSchema),
  note: z.string(),
});

export type FlowPlanResult = z.infer<typeof OutputSchema>;

const SYSTEM = `Du är Flow – MyFloves lugna, empatiska AI-kompanjon.
Din uppgift här är FlowPlan: föreslå en logisk och tidseffektiv ordning på dagens uppgifter.

Basera ordningen på:
- Deadlines
- Uppgifternas naturliga beroenden och väntetider
- Uppskattad tidsåtgång
- Vad som kan ske parallellt
- Användarens energinivå just nu
- Tid på dygnet

Blueprint-regler:
- Målet är inte att få allt gjort. Målet är att få rätt saker gjorda.
- Vid låg energi: föreslå färre uppgifter, börja med det minsta/lättaste.
- Vid hög energi: lägg tyngre uppgifter först.
- Varje "why" ska vara kort (max 12 ord), varm, aldrig dömande.
- "intro" är en mening (max 20 ord) som möter användaren där hen är.
- "note" är en avslutande mening som avlastar (t.ex. "Du behöver inte hinna allt").
- Använd bara task-id från listan. Hoppa gärna över uppgifter som inte passar dagens energi – det är okej.
- Svara ENDAST med giltig JSON enligt schemat, ingen annan text.`;

export const planFlowSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<FlowPlanResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = [
      `Energinivå: ${data.energy}`,
      data.focus ? `Dagens fokus: ${data.focus}` : null,
      data.timeAvailableMin ? `Tillgänglig tid: ${data.timeAvailableMin} min` : null,
      "",
      "Uppgifter:",
      ...data.tasks.map(
        (t) => `- id=${t.id} | ${t.title}${t.dueDate ? ` (deadline ${t.dueDate})` : ""}`,
      ),
      "",
      "Returnera JSON: { intro, plan: [{ taskId, order, estimatedMin, why }], note }.",
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
    if (!res.ok) throw new Error(`AI-fel: ${res.status} ${await res.text()}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI:n svarade i fel format.");
    }
    return OutputSchema.parse(parsed);
  });
