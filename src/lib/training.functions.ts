import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EXERCISES } from "@/lib/exercise-library";
import { trainingWorkoutRequest, visualTrainingSession } from "@/lib/training-program";
import type { Workout } from "@/lib/workout-generator";

const InputSchema = z.object({
  goal: z.string().min(1).max(300),
  focus: z.enum(["styrka", "kondition", "blandat", "viktnedgång"]),
  daysPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(10).max(180),
  level: z.enum(["nybörjare", "van", "erfaren"]),
  days: z.array(z.string().max(20)).max(7).optional(),
  equipment: z.string().max(300).optional(),
  limitations: z.string().max(500).optional(),
});

const TYPE_ALIASES: Record<string, "styrka" | "kondition" | "rörlighet" | "vila"> = {
  styrka: "styrka",
  kondition: "kondition",
  kondtion: "kondition",
  cardio: "kondition",
  puls: "kondition",
  rörlighet: "rörlighet",
  rorlighet: "rörlighet",
  mobilitet: "rörlighet",
  stretch: "rörlighet",
  yoga: "rörlighet",
  vila: "vila",
  återhämtning: "vila",
  aterhamtning: "vila",
};

const SessionTypeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const key = value.trim().toLowerCase();
    return (
      TYPE_ALIASES[key] ??
      (key.includes("vila")
        ? "vila"
        : key.includes("rörl")
          ? "rörlighet"
          : key.includes("kond")
            ? "kondition"
            : "styrka")
    );
  },
  z.enum(["styrka", "kondition", "rörlighet", "vila"]),
);

const OutputSchema = z.object({
  intro: z.string(),
  weeks: z.number().int().min(1).max(12).optional(),
  sessions: z
    .array(
      z.object({
        day: z.string(),
        title: z.string(),
        type: SessionTypeSchema,
        minutes: z.coerce.number().int().min(5).max(180).catch(30).optional(),
        exercises: z
          .array(z.union([z.string(), z.record(z.string(), z.any())]))
          .default([])
          .transform((list) =>
            list.map((item) =>
              typeof item === "string" ? item : Object.values(item).filter(Boolean).join(" – "),
            ),
          ),
        blocks: z
          .array(
            z.object({
              exerciseId: z.string(),
              section: z.enum(["uppvärmning", "huvuddel", "nedvarvning"]),
              sets: z.number().int().min(1).max(5),
              reps: z.number().int().min(1).max(40).nullable().optional(),
              seconds: z.number().int().min(1).max(300).nullable().optional(),
              restSeconds: z.number().int().min(0).max(180),
            }),
          )
          .min(3)
          .max(14)
          .optional(),
      }),
    )
    .min(1)
    .max(7),
  stepGoal: z.coerce.number().int().min(1000).max(30000).optional(),
  note: z.string(),
});

type GeneratedProgram = z.infer<typeof OutputSchema>;
export type TrainingProgram = Omit<GeneratedProgram, "sessions"> & {
  sessions: (Omit<GeneratedProgram["sessions"][number], "blocks"> & { workout?: Workout })[];
};

const SYSTEM = `Du är Pace – Paceables lugna, empatiska AI-kompanjon.
Här bygger du ett realistiskt träningsprogram (styrka/kondition) utifrån användarens mål.

Regler:
- Antal pass = exakt antal träningsdagar per vecka som användaren angett. Använd exakt de valda dagarna, en gång var.
- Varje pass: kort titel, typ, ungefärlig tid och blocks med 1–2 uppvärmningsövningar, huvuddel och 1–2 nedvarvningsövningar.
- Använd ENDAST exerciseId från det angivna bildbiblioteket. Alla pass ska kunna visas med bilder och instruktioner. Välj pulshöjande övningar ur listan för kondition.
- Varje block har exerciseId, section, sets, reps eller seconds (den andra null), restSeconds. Inga fritextövningar utanför biblioteket.
- Respektera utrustning och ömma områden i listan. Sätt aldrig medicinska råd eller okända övningar i programmet.
- Anpassa efter nivå, utrustning och eventuella begränsningar. Aldrig medicinska råd.
- Föreslå ett dagligt stegmål (stepGoal) som passar målet.
- Vid fokus "viktnedgång": bygg ett hållbart upplägg med kombination av styrka (behåller muskler) och pulshöjande pass, högre stegmål (ofta 8000–10000), och betona vardagsrörelse och regelbundenhet framför hård träning. Ge aldrig kost- eller kaloriråd, inga dietplaner, inga löften om kilon per vecka.
- "intro" är en mening (max 20 ord). "note" avlastar, t.ex. "Ett pass i veckan räknas också."
- Svenska, du-form, inga emojis, aldrig dömande.
- Svara ENDAST med giltig JSON enligt schemat.`;

export const generateTrainingProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<TrainingProgram> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const request = trainingWorkoutRequest(data);
    const catalog = EXERCISES.filter(
      (exercise) =>
        exercise.equipment.some((item) => request.equipment.includes(item)) &&
        !exercise.avoid?.some((area) => request.limitations.includes(area)) &&
        (data.level !== "nybörjare" || exercise.difficulty !== "utmanande"),
    ).map((exercise) =>
      [
        exercise.id,
        exercise.name,
        exercise.role,
        exercise.focus,
        exercise.difficulty,
        exercise.measure,
      ].join(" | "),
    );

    const userPrompt = [
      `Mål: ${data.goal}`,
      `Fokus: ${data.focus}`,
      `Dagar per vecka: ${data.daysPerWeek}`,
      `Tid per pass: ${data.minutesPerSession} minuter`,
      `Nivå: ${data.level}`,
      data.days?.length
        ? `Träningsdagar (använd exakt dessa som "day"): ${data.days.join(", ")}`
        : null,
      data.equipment ? `Utrustning: ${data.equipment}` : null,
      data.limitations ? `Begränsningar: ${data.limitations}` : null,
      "",
      "Bildbibliotek (id | namn | roll | fokus | nivå | mått):",
      catalog.join("\n"),
      "Returnera JSON: { intro, weeks, sessions: [{ day, title, type, minutes, blocks: [{ exerciseId, section, sets, reps, seconds, restSeconds }] }], stepGoal, note }.",
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
    if (result.sessions.length !== data.daysPerWeek) {
      throw new Error(
        "Pace kunde inte få ihop rätt antal pass. Försök igen eller välj Skapa manuellt.",
      );
    }
    return {
      ...result,
      sessions: result.sessions.map((session, index) =>
        visualTrainingSession(
          {
            ...session,
            day: data.days?.[index] ?? session.day,
            blocks: session.blocks?.map((block) => ({
              ...block,
              reps: block.reps ?? undefined,
              seconds: block.seconds ?? undefined,
            })),
          },
          data,
        ),
      ),
    };
  });
