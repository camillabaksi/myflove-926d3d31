import { createFileRoute } from "@tanstack/react-router";
import { cspDiagnostic } from "@/lib/private-diagnostics";

// Receives CSP violation reports from the browser.
// Browsers post either application/csp-report (legacy report-uri)
// or application/reports+json (modern Reporting API / report-to).
export const Route = createFileRoute("/api/public/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Bound reads even if the sender omits or falsifies Content-Length.
        const reader = request.body?.getReader();
        if (!reader) return new Response(null, { status: 204 });
        try {
          const chunks: Uint8Array[] = [];
          let size = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 16384) {
              await reader.cancel();
              return new Response(null, { status: 413 });
            }
            chunks.push(value);
          }
          const bytes = new Uint8Array(size);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
          const reports = Array.isArray(parsed) ? parsed.slice(0, 10) : [parsed];
          for (const report of reports) {
            if (typeof report !== "object" || report === null) continue;
            const row = report as Record<string, unknown>;
            console.warn("[CSP-REPORT]", cspDiagnostic(row["csp-report"] ?? row.body));
          }
        } catch {
          // Invalid public reports must not place attacker content in logs.
        } finally {
          reader.releaseLock();
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
