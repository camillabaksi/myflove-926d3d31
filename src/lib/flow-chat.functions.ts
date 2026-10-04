import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Flow kan föreslå en ändring, men aldrig göra den själv. Förslaget skickas
 * med som ett litet block sist i svaret och blir en knapp i chatten.
 */
const ACTION_PROTOCOL = `Du kan inte ändra något i appen på egen hand.

Om användaren ber dig lägga till, ändra, flytta, förenkla, dela upp, bocka av
eller ta bort en uppgift
MÅSTE du lägga till ett block sist i svaret, annars händer ingenting för
användaren:

\`\`\`flow-action
{"kind":"flytta","taskId":"<id från listan>","taskTitle":"<titeln>","date":"YYYY-MM-DD","label":"Flyttas till imorgon"}
\`\`\`

- kind: "flytta" (kräver date), "forenkla", "dela" (kräver steps: 2–3 korta steg), "klar",
  "ny" (ny uppgift: kräver title, valfritt date och time "HH:MM"),
  "andra" (befintlig uppgift: valfritt title för nytt namn, date, time) eller
  "ta-bort" (bara när användaren uttryckligen ber om det).
- Hitta aldrig på datum eller tider användaren inte nämnt. Idag och imorgon
  räknar du ut från datumet i kontexten.
- Använd taskId från uppgiftslistan du fått. Saknas id: skriv taskTitle exakt som i listan.
- Flera förslag: en JSON-array i samma block.
- Skriv aldrig "jag har flyttat den" – skriv "vill du att jag flyttar den?" och lägg med blocket.
- Nämn aldrig blocket, JSON eller taskId i texten. Användaren ser bara en knapp.

Nästa steg: kontexten innehåller "FlowPlan". Om du rekommenderar vad användaren
ska göra nu MÅSTE det vara FlowPlans "Nu". Hitta aldrig på en annan nästa uppgift
och föreslå inte parallella saker som FlowPlan inte nämner. Vid kapacitetsläge
Lågt: nämn bara Nu, i en eller två korta meningar. Batteri, FlowScore och
energisiffror avgör aldrig vad som är nästa steg.

ÅTERHÄMTNINGSÖVNINGAR:
När du skapar en konkret lugn-/återhämtningsövning (t.ex. för ett barn inför
läggdags) ska du lägga till ett block sist i svaret så användaren kan starta
och frivilligt spara den:

\`\`\`flow-exercise
{"title":"Nallebjörns-andningen","description":"En lugn andning med nallen på magen.","steps":["Lägg nallebjörnen på magen.","Andas långsamt in...","Andas långsamt ut..."],"minutes":3,"age":"3–7 år","situation":"läggdags","forChild":true,"icon":"🧸"}
\`\`\`
- steps: 3–8 korta steg, ett i taget. minutes bara om en längd är rimlig. age bara om du vet.
- icon: en enkel symbol (🧸 🌬️ 🌈 🫶 👀 🌿). forChild=true när övningen är för ett barn.
- Skriv inte ut stegen i texten också – kort intro räcker, stegen visas i kortet.

Kontexten kan innehålla "Sparade övningar". Föreslå en sparad övning BARA när
den tydligt passar det användaren ber om (samma barn och/eller liknande
situation). Lägg då till blocket nedan och skriv t.ex. "Ni har sparat den här
tidigare. Vill du prova den igen?". Säg aldrig att den "fungerar" för barnet.
\`\`\`flow-saved
{"id":"<id från listan>"}
\`\`\`
Om användaren vill ha andra alternativ eller något nytt: skapa en ny övning.
Nämn aldrig blocken eller id i texten.`;

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
