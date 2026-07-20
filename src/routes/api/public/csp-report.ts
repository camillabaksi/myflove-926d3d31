import { createFileRoute } from "@tanstack/react-router";

// Receives CSP violation reports from the browser.
// Browsers post either application/csp-report (legacy report-uri)
// or application/reports+json (modern Reporting API / report-to).
export const Route = createFileRoute("/api/public/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text();
          // Log to Worker console — visible in server function logs.
          console.warn("[CSP-REPORT]", body.slice(0, 4000));
        } catch (err) {
          console.error("[CSP-REPORT] failed to read body", err);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
