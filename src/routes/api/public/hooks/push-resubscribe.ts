import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Anropas av service workern när webbläsaren byter ut prenumerationen
// (pushsubscriptionchange). Den gamla endpointen fungerar som hemlighet:
// vi flyttar bara över raden som redan matchar den.

const Schema = z.object({
  oldEndpoint: z.string().url(),
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const Route = createFileRoute("/api/public/hooks/push-resubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Schema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing } = await supabaseAdmin
          .from("push_subscriptions")
          .select("user_id, user_agent")
          .eq("endpoint", parsed.oldEndpoint)
          .maybeSingle();
        if (!existing) return new Response("Unknown subscription", { status: 404 });

        const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
          {
            user_id: existing.user_id,
            endpoint: parsed.endpoint,
            p256dh: parsed.p256dh,
            auth: parsed.auth,
            user_agent: existing.user_agent,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        if (parsed.endpoint !== parsed.oldEndpoint) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", parsed.oldEndpoint);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
