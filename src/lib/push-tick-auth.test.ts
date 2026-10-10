import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  sendPushTo: vi.fn(),
  post: null as null | ((context: { request: Request }) => Promise<Response>),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    () => (options: { server: { handlers: { POST: NonNullable<typeof mocks.post> } } }) => {
      mocks.post = options.server.handlers.POST;
      return options;
    },
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: mocks.rpc, from: mocks.from },
}));
vi.mock("@/lib/push.server", () => ({ sendPushTo: mocks.sendPushTo }));

await import("@/routes/api/public/hooks/push-tick");
const SECRET = "a1".repeat(32);
const REJECTED_HEADERS: Record<string, string>[] = [
  {},
  { apikey: "the-public-supabase-key" },
  { authorization: "Bearer sb_publishable_public-key" },
  { authorization: "Bearer short" },
  { authorization: `Basic ${SECRET}` },
];

async function post(headers: HeadersInit = {}) {
  return mocks.post!({
    request: new Request("https://example.test/api/public/hooks/push-tick", {
      method: "POST",
      headers,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  // Tom kö och inga användarinställningar: testet skickar aldrig en riktig notis.
  const result = { data: [], error: null };
  const chain = {
    select: () => chain,
    lte: () => chain,
    is: () => chain,
    eq: () => chain,
    or: () => chain,
    limit: () => chain,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  mocks.from.mockReturnValue(chain);
});

describe("push-tick kräver privat cron-autentisering före alla utskick", () => {
  it.each(REJECTED_HEADERS)("avvisar saknad/publik/felaktig autentisering: %j", async (headers) => {
    expect((await post(headers)).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.sendPushTo).not.toHaveBeenCalled();
  });

  it("avvisar en felaktig privat hemlighet utan att läsa påminnelser", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await post({ authorization: `Bearer ${SECRET}` })).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.sendPushTo).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { message: "RPC missing" } },
    { data: null, error: { message: "Database unavailable" } },
  ])("stänger vid verifieringsfel utan reservväg via apikey", async (result) => {
    mocks.rpc.mockResolvedValue(result);
    const response = await post({ authorization: `Bearer ${SECRET}`, apikey: "public" });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(SECRET);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("stänger också vid ett kastat nätverksfel", async () => {
    mocks.rpc.mockRejectedValue(new Error("Network unavailable"));
    expect((await post({ authorization: `Bearer ${SECRET}` })).status).toBe(503);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("kräver uttryckligt true från verifieringen", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    expect((await post({ authorization: `Bearer ${SECRET}` })).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("låter det verifierade cron-jobbet fortsätta till den befintliga utskickskoden", async () => {
    const response = await post({ authorization: `Bearer ${SECRET}` });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, sent: 0, gone: 0 });
    expect(mocks.rpc).toHaveBeenCalledWith("validate_push_tick_secret", { _secret: SECRET });
    expect(mocks.from).toHaveBeenCalledWith("push_reminders");
    expect(mocks.sendPushTo).not.toHaveBeenCalled();
  });
});
