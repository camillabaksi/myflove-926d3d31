import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  /** Livspusslet: kapacitet, energi och vad som pågår i användarens olika livsområden. */
  context: z.string().max(4000).optional(),
});

export const chatWithFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const { FLOW_SYSTEM_PROMPT } = await import("./flow-personality");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: FLOW_SYSTEM_PROMPT },
          { role: "system" as const, content: ACTION_PROTOCOL },
          ...(data.context
            ? [
                {
                  role: "system" as const,
                  content: `Så här ser användarens livspussel ut just nu:\n${data.context}`,
                },
              ]
            : []),
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) {
      throw new Response("För många frågor just nu. Prova igen om en stund.", { status: 429 });
    }
    if (res.status === 402) {
      throw new Response("AI-krediterna är slut. Lägg till fler i arbetsytan.", { status: 402 });
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI-fel: ${res.status} ${text}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply =
      json.choices?.[0]?.message?.content ?? "Jag hittar inga ord just nu. Kan du säga det igen?";
    return { reply };
  });
