import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  texts: z.array(z.string().min(1).max(600)).min(1).max(80),
});

export type AutoTranslateResult = { translations: Record<string, string> };

const SYSTEM = `Du översätter gränssnittstext i appen MyFlove från svenska till engelska.

Regler:
- Behåll tonen: lugn, varm, kort, aldrig skuldbeläggande.
- Behåll emojis, siffror, interpunktion och radbrytningar exakt.
- Översätt INTE produktnamn: MyFlove, Flow, QuickFlow, FlowPlan, FlowScore, Ljusboost (= "Light boost"), Mikropaus (= "Micro pause").
- Om texten redan är engelska, returnera den oförändrad.
- Svara ENDAST med giltig JSON: { "items": [{ "sv": "...", "en": "..." }] } med exakt samma svenska strängar som du fick, i samma ordning.`;

export const autoTranslateToEnglish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<AutoTranslateResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ texts: data.texts }) },
        ],
      }),
    });

    if (res.status === 429) throw new Response("För många förfrågningar just nu.", { status: 429 });
    if (res.status === 402) throw new Response("AI-krediterna är slut.", { status: 402 });
    if (!res.ok) throw new Error(`AI-fel: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let parsed: { items?: Array<{ sv?: string; en?: string }> } = {};
    try {
      parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      return { translations: {} };
    }

    const translations: Record<string, string> = {};
    for (const item of parsed.items ?? []) {
      if (item?.sv && item?.en && data.texts.includes(item.sv)) {
        translations[item.sv] = item.en;
      }
    }
    return { translations };
  });
