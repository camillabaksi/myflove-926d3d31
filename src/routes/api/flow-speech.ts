import { createFileRoute } from "@tanstack/react-router";

/**
 * Röst åt Flow: tar emot text från chatten och strömmar tillbaka tal (PCM
 * via SSE) från Lovable AI Gateway. Kräver inloggad användare (bearer-token).
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev";
const MODEL = "google/gemini-3.1-flash-tts-preview";
const VOICE = "Kore";

export const Route = createFileRoute("/api/flow-speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verifiera användaren innan vi syntetiserar (kostar krediter).
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data.user) return new Response("Unauthorized", { status: 401 });

        let text: string;
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!text) return new Response("Bad request", { status: 400 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("TTS är inte konfigurerat", { status: 500 });

        const upstream = await fetch(`${GATEWAY_URL}/v1/audio/speech`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            contents: [
              {
                role: "user",
                parts: [{ text: `Läs upp detta lugnt och varmt på svenska: ${text}` }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
            },
            stream_format: "sse",
          }),
          signal: request.signal,
        });

        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
