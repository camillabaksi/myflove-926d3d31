import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().optional(),
  /** Antal dagar kvar till deadline (negativt = passerad). */
  daysUntilDue: z.number().optional(),
  /** Uppgiften har aktiva deadline-påminnelser (t.ex. 7/3/1 dag innan). */
  hasDeadlineReminder: z.boolean().optional(),
  /** Sant om en påminnelse redan har slagit till eller slår till idag. */
  reminderActiveNow: z.boolean().optional(),
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
  /** Sätts till true när uppgiften prioriterats upp p.g.a. deadline-påminnelse. */
  deadlineBoost: z.boolean().optional(),
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
- Deadlines, särskilt uppgifter markerade [PÅMINNELSE AKTIV]
- Uppgifternas naturliga beroenden och väntetider
- Uppskattad tidsåtgång
- Vad som kan ske parallellt
- Användarens energinivå just nu
- Tid på dygnet

Deadline-regler (viktigast):
- Uppgifter markerade [PÅMINNELSE AKTIV] har en påminnelse som redan tickat igång – de ska ligga tidigt i planen, före uppgifter utan deadline.
- Ju färre dagar kvar, desto högre upp. Passerad deadline hamnar först.
- För dessa: sätt "deadlineBoost": true och skriv en "why" som tydligt nämner varför den går före, t.ex. "Deadline om 2 dagar – en bit idag räcker".
- Även vid låg energi: ta med minst en sådan uppgift, men föreslå ett litet steg.

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
      ...data.tasks.map((t) => {
        const bits: string[] = [];
        if (t.dueDate) bits.push(`deadline ${t.dueDate}`);
        if (typeof t.daysUntilDue === "number") {
          bits.push(
            t.daysUntilDue < 0
              ? `${Math.abs(t.daysUntilDue)} dag(ar) försenad`
              : `${t.daysUntilDue} dag(ar) kvar`,
          );
        }
        if (t.hasDeadlineReminder) bits.push("påminnelser på");
        const meta = bits.length ? ` (${bits.join(", ")})` : "";
        const flag = t.reminderActiveNow ? " [PÅMINNELSE AKTIV]" : "";
        return `- id=${t.id} | ${t.title}${meta}${flag}`;
      }),
      "",
      "Returnera JSON: { intro, plan: [{ taskId, order, estimatedMin, why, deadlineBoost }], note }.",
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
