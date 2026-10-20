import { createFileRoute } from "@tanstack/react-router";

// Legacy workers cannot prove account ownership. Renewal uses the existing
// authenticated subscribeToPush flow when the app next opens.

export const Route = createFileRoute("/api/public/hooks/push-resubscribe")({
  server: {
    handlers: {
      POST: async () => new Response("Authenticated registration required", {
        status: 410, headers: { "Cache-Control": "no-store" },
      }),
    },
  },
});
