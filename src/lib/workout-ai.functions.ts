import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EXERCISES } from "@/lib/exercise-library";

/**
 * AI-träningsgeneratorn för "Flow skapar ditt pass".
 *
 * AI:n väljer bland exakt samma övningar som det befintliga biblioteket och
 * returnerar samma blockform som den lokala generatorn. Klienten faller
 * tillbaka på den lokala generatorn om något går fel.
 */

const InputSchema = z.object({
  intent: z.enum(["styrka", "rörlighet", "återhämtning", "eget"]),
  text: z.string().max(600).optional(),
  minutes: z.number().int().min(5).max(120),
  energy: z.enum(["låg", "normal", "mycket"]),
  energyPercent: z.number().int().min(0).max(100).optional(),
  place: z.enum(["hemma", "gym", "ute"]),
  equipment: z.array(z.string().max(30)).max(10),
  focus: z.array(z.string().max(30)).max(10),
  limitations: z.array(z.string().max(30)).max(10),
});

const PlanSchema = z.object({
  title: z.string().max(80),
  note: z.string().max(400),
  blocks: z
    .array(
      z.object({
        exerciseId: z.string(),
        section: z.enum(["uppvärmning", "huvuddel", "nedvarvning"]),
        sets: z.coerce.number().int().min(1).max(5).catch(2),
        reps: z.coerce.number().int().min(0).max(40).nullable().catch(null),
        seconds: z.coerce.number().int().min(0).max(300).nullable().catch(null),
        restSeconds: z.coerce.number().int().min(0).max(180).catch(45),
      }),
    )
    .min(3)
    .max(14),
});

export type AiWorkoutPlanResult = z.infer<typeof PlanSchema>;


const SYSTEM = `Du är Flow – MyFloves lugna, icke-dömande träningskompanjon.
Du bygger ett enskilt träningspass av övningar som redan finns i listan.

Regler:
- Använd ENDAST exerciseId från listan. Hitta aldrig på egna övningar.
- Passet ska ha 1–2 uppvärmningsövningar, huvuddel och 1–2 nedvarvningsövningar.
- Anpassa efter energin: låg energi = färre övningar, färre set, längre vila, mjukare övningar.
- Respektera ömma områden, plats och tillgänglig utrustning.
- Håll total tid nära användarens valda tid (räkna arbete + vila).
- Vila: restSeconds 0 för uppvärmning och nedvarvning, 15–40 sek i huvuddelen. Hellre fler set än långa pauser.
- Fyll den valda tiden – varken mycket kortare eller längre.
- reps används för repbaserade övningar, seconds för tidbaserade – sätt den andra till null.
- "note" är 1–3 korta meningar i du-form som förklarar varför passet ser ut så här idag, avlastande och utan skuld. Inga medicinska råd, inga emojis.`;

export const generateAiWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<AiWorkoutPlanResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const equipment = data.equipment.length ? data.equipment : ["kroppsvikt"];
    const catalog = EXERCISES.filter((e) =>
      e.equipment.some((eq) => equipment.includes(eq)),
    ).map((e) =>
      [
        e.id,
        e.name,
        e.role,
        e.focus,
        e.difficulty,
        e.measure,
        e.avoid?.length ? `ömt:${e.avoid.join("/")}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    );

    const userPrompt = [
      `Typ av pass: ${data.intent}`,
      `Tid: ${data.minutes} minuter`,
      `Energi: ${data.energy}${
        data.energyPercent != null ? ` (batteri ${data.energyPercent} %)` : ""
      }`,
      `Plats: ${data.place}`,
      `Utrustning: ${equipment.join(", ")}`,
      `Fokus: ${data.focus.join(", ") || "helkropp"}`,
      `Ömma områden: ${data.limitations.join(", ") || "inga angivna"}`,
      data.text?.trim() ? `Användaren skriver: ${data.text.trim()}` : null,
      "",
      "Övningar att välja bland (id | namn | roll | fokus | svårighet | mått):",
      catalog.join("\n"),
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
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Response("För många frågor just nu.", { status: 429 });
    if (res.status === 402) throw new Response("AI-krediterna är slut.", { status: 402 });
    if (!res.ok) throw new Error(`AI-fel: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = (json.choices?.[0]?.message?.content ?? "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "");

    if (!text.trim()) throw new Error("AI:n svarade tomt.");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("AI:n svarade i fel format.");
    }
    return PlanSchema.parse(parsed);
  });
