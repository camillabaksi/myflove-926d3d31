import { beforeEach, describe, expect, it, vi } from "vitest";
import { listExternalEvents } from "./calendar-connect.functions";

/**
 * Externa kalenderläsningar ska följa leverantörens fortsättningssidor och
 * markera ofullständiga resultat – en upptagen kalender får aldrig se ut
 * som ledig tid.
 */

const state = vi.hoisted(() => ({
  responses: [] as Array<{ ok: boolean; status: number; body: unknown }>,
  paths: [] as string[],
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      validator: () => builder,
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => null }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/server/appUserConnections.server", () => ({
  getConnectionKeyForUser: async () => "connection-key",
  saveConnectionKeyForUser: vi.fn(),
  deleteConnectionForUser: vi.fn(),
}));
vi.mock("@/integrations/lovable/appUserConnector", () => ({
  appUserReconnectRequired: async () => false,
  authorizeAppUserOAuth: vi.fn(),
  callAsAppUser: async ({ path }: { path: string }) => {
    state.paths.push(path);
    const next = state.responses.shift();
    if (!next) throw new Error("Inget testsvar kvar");
    return {
      ok: next.ok,
      status: next.status,
      json: async () => next.body,
    };
  },
  disconnectAppUser: vi.fn(),
  exchangeAppUserOAuthCode: vi.fn(),
}));

const run = listExternalEvents as unknown as (args: {
  context: { userId: string };
  data: { from: string; to: string };
}) => Promise<{ events: unknown[]; reconnectRequired: string | null; incomplete: boolean }>;

const context = { userId: "user-1" };
const range = { from: "2026-10-01", to: "2026-10-31" };

beforeEach(() => {
  state.responses = [];
  state.paths = [];
});

describe("Externa kalenderläsningar", () => {
  it("följer Googles fortsättningssidor och slår ihop alla händelser", async () => {
    state.responses = [
      {
        ok: true,
        status: 200,
        body: {
          items: [{ id: "g1", summary: "Möte 1", start: { dateTime: "2026-10-05T09:00:00+02:00" } }],
          nextPageToken: "sida-2",
        },
      },
      {
        ok: true,
        status: 200,
        body: {
          items: [{ id: "g2", summary: "Möte 2", start: { dateTime: "2026-10-06T09:00:00+02:00" } }],
        },
      },
      // Outlook har ingen koppling i testet? Båda leverantörerna får svar –
      // andra svaret är tomt så bara Google bidrar med händelser.
      { ok: true, status: 200, body: { value: [] } },
    ];
    const result = await run({ context, data: range });
    expect(result.events).toHaveLength(2);
    expect(result.incomplete).toBe(false);
    expect(state.paths.length).toBeGreaterThanOrEqual(2);
    expect(state.paths[1]).toContain("pageToken=sida-2");
  });

  it("markerar resultatet som ofullständigt när en leverantör svarar fel", async () => {
    state.responses = [
      { ok: false, status: 500, body: {} },
      { ok: true, status: 200, body: { value: [] } },
    ];
    const result = await run({ context, data: range });
    expect(result.incomplete).toBe(true);
  });

  it("ber om återanslutning vid 401 i stället för att visa en tyst tom kalender", async () => {
    state.responses = [
      { ok: false, status: 401, body: {} },
      { ok: true, status: 200, body: { value: [] } },
    ];
    const result = await run({ context, data: range });
    expect(result.reconnectRequired).toBe("google");
    expect(result.incomplete).toBe(false);
  });

  it("följer Outlooks nextLink och markerar ofullständigt vid trasig länk", async () => {
    state.responses = [
      { ok: true, status: 200, body: { items: [] } },
      {
        ok: true,
        status: 200,
        body: {
          value: [{ id: "o1", subject: "Tandläkare", start: { dateTime: "2026-10-07T12:00:00" } }],
          "@odata.nextLink": "inte-en-url",
        },
      },
    ];
    const result = await run({ context, data: range });
    expect(result.events).toHaveLength(1);
    expect(result.incomplete).toBe(true);
  });
});
