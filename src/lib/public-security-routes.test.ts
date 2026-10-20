import { beforeEach, expect, it, vi } from "vitest";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const routes = vi.hoisted(() => new Map<string, Handler>());
const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { server: { handlers: { POST: Handler } } }) => {
    routes.set(path, options.server.handlers.POST);
    return options;
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: database }));
await import("@/routes/api/public/hooks/push-resubscribe");
await import("@/routes/api/public/csp-report");
beforeEach(() => vi.clearAllMocks());

async function post(path: string, body: string) {
  const handler = routes.get(path);
  if (!handler) throw new Error("Missing handler");
  return handler({ request: new Request(`https://example.test${path}`, { method: "POST", body }) });
}

it("rejects endpoint-only renewal without reading or modifying any subscription", async () => {
  const response = await post(
    "/api/public/hooks/push-resubscribe",
    JSON.stringify({
      oldEndpoint: "https://fcm.googleapis.com/old",
      endpoint: "https://attacker.test/new",
    }),
  );
  expect(response.status).toBe(410);
  expect(database.from).not.toHaveBeenCalled();
});
it("does not place CSP URLs or script samples in logs", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const response = await post(
    "/api/public/csp-report",
    JSON.stringify({
      "csp-report": {
        "effective-directive": "script-src",
        "script-sample": "synthetic diary",
        "document-uri": "https://example.test/private",
      },
    }),
  );
  expect(response.status).toBe(204);
  expect(warn).toHaveBeenCalledWith("[CSP-REPORT]", {
    directive: "script-src",
    disposition: "report",
  });
  expect(JSON.stringify(warn.mock.calls)).not.toContain("synthetic diary");
  warn.mockRestore();
});
it("bounds CSP report bodies even without a content-length header", async () => {
  expect((await post("/api/public/csp-report", "x".repeat(16385))).status).toBe(413);
});
it("ignores malformed public reports without logging attacker content", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  expect((await post("/api/public/csp-report", "synthetic diary")).status).toBe(204);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
