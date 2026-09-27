import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://ai.gateway.lovable.dev";
const MODEL = "google/gemini-3.5-transcribe";
const MAX_FILE_BYTES = 14 * 1024 * 1024; // Gemini-gränsen är 14 MB

export const Route = createFileRoute("/api/flow-transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) {
          return new Response(JSON.stringify({ error: "Inloggning krävs" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const {
          data: { user },
          error: authError,
        } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
          return new Response(JSON.stringify({ error: "Inloggning krävs" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > MAX_FILE_BYTES + 1024 * 1024) {
          return new Response(JSON.stringify({ error: "Ljudfilen är för stor" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        let incoming: FormData;
        try {
          incoming = await request.formData();
        } catch {
          return new Response(JSON.stringify({ error: "Kunde inte läsa ljudet" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const file = incoming.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
          return new Response(JSON.stringify({ error: "Ingen giltig ljudfil" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Röst-till-text är inte konfigurerad" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const form = new FormData();
        form.append("model", MODEL);
        form.append("file", file, file.name || "recording.wav");
        form.append("response_format", "json");
        form.append("stream", "true");

        const upstream = await fetch(`${GATEWAY_URL}/v1/audio/transcriptions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: form,
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const errorBody = await upstream.text();
          console.error(`Transcribe failed [${upstream.status}]: ${errorBody}`);
          return new Response(errorBody || JSON.stringify({ error: "Transkriberingen misslyckades" }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
