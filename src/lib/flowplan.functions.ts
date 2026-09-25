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
Uppgifterna kommer i en redan beslutad ordning. Ändra aldrig ordningen och utelämna aldrig en uppgift.
Din uppgift är endast att ge en kort praktisk förklaring och uppskatta tid för varje uppgift.

Blueprint-regler:
- Varje "why" ska vara kort (max 12 ord), varm, aldrig dömande.
- "intro" är en mening (max 20 ord) som möter användaren där hen är.
- "note" är en avslutande mening som avlastar (t.ex. "Du behöver inte hinna allt").
- Använd varje task-id exakt en gång och behåll listans ordning.
- Svara ENDAST med giltig JSON enligt schemat, ingen annan text.`;

export const planFlowSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<FlowPlanResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = [
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
        return `${index + 1}. id=${t.id} | ${t.title}${meta}${flag}`;
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
    const output = OutputSchema.parse(parsed);
    const byId = new Map(output.plan.map((item) => [item.taskId, item] as const));
    return {
      ...output,
      plan: data.tasks.map((task, order) => {
        const explanation = byId.get(task.id);
        return {
          taskId: task.id,
          order,
          estimatedMin: explanation?.estimatedMin ?? 15,
          why: explanation?.why ?? "Ett steg i taget räcker.",
          deadlineBoost: task.reminderActiveNow || undefined,
        };
      }),
    };
  });
