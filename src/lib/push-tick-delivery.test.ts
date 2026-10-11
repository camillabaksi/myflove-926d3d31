import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  send: vi.fn(),
  post: null as null | ((context: { request: Request }) => Promise<Response>),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    () => (options: { server: { handlers: { POST: NonNullable<typeof mocks.post> } } }) => {
      mocks.post = options.server.handlers.POST;
      return options;
    },
}));
vi.mock("@/lib/push-tick-auth.server", () => ({ authorizePushTick: async () => null }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/push.server", () => ({ sendPushTo: mocks.send }));
await import("@/routes/api/public/hooks/push-tick");

let tables: Record<string, Row[]>;
let beforeClaim: (() => void) | undefined;
const row = () => tables.push_reminders[0];
const post = () =>
  mocks.post!({
    request: new Request("https://test.invalid/api/public/hooks/push-tick", { method: "POST" }),
  });

// Modellera databasens villkorade uppdateringar och separata lässnapshots.
function query(table: string) {
  let patch: Row | undefined;
  let deleting = false;
  let cap = Infinity;
  const filters: ((r: Row) => boolean)[] = [];
  const execute = () => {
    if (patch?.processing_token && beforeClaim) {
      const callback = beforeClaim;
      beforeClaim = undefined;
      callback();
    }
    const matched = (tables[table] ?? []).filter((r) => filters.every((f) => f(r))).slice(0, cap);
    if (patch) matched.forEach((r) => Object.assign(r, patch));
    if (deleting) tables[table] = tables[table].filter((r) => !matched.includes(r));
    return { data: structuredClone(matched), error: null };
  };
  const chain = {
    select: () => chain,
    update: (value: Row) => {
      patch = value;
      return chain;
    },
    delete: () => {
      deleting = true;
      return chain;
    },
    eq: (key: string, value: unknown) => {
      filters.push((r) => r[key] === value);
      return chain;
    },
    is: (key: string, value: unknown) => {
      filters.push((r) => r[key] === value);
      return chain;
    },
    lte: (key: string, value: string) => {
      filters.push((r) => String(r[key]) <= value);
      return chain;
    },
    limit: (n: number) => {
      cap = n;
      return chain;
    },
    or: (expression: string) => {
      if (expression.startsWith("processing_until.is.null,")) {
        const cutoff = expression.split("processing_until.lt.")[1];
        filters.push((r) => r.processing_until == null || String(r.processing_until) < cutoff);
      }
      return chain;
    },
    maybeSingle: async () => {
      const result = execute();
      return { ...result, data: result.data[0] ?? null };
    },
    then: (resolve: (value: ReturnType<typeof execute>) => unknown) =>
      Promise.resolve(execute()).then(resolve),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T12:00:00Z"));
  beforeClaim = undefined;
  tables = {
    push_reminders: [
      {
        id: "one",
        user_id: "owner-a",
        kind: "task",
        title: "Test",
        body: "Test",
        client_key: "task:one",
        url: "/idag",
        deliver_at: "2026-10-11T11:59:00.000Z",
        delivered_at: null,
        canceled_at: null,
        processing_token: null,
        processing_until: null,
        sent_endpoints: [],
      },
    ],
    push_subscriptions: ["device-a", "device-b"].map((endpoint) => ({
      user_id: "owner-a",
      endpoint,
      p256dh: "test",
      auth: "test",
    })),
    user_kv: [],
    push_preferences: [],
  };
  mocks.from.mockImplementation(query);
  mocks.send.mockResolvedValue("ok");
});
afterEach(() => vi.useRealTimers());

describe("cron-kön: leverans, paus och samtidiga körningar", () => {
  it("kvitterar per enhet och försöker senare bara på den som misslyckades", async () => {
    mocks.send.mockResolvedValueOnce("ok").mockResolvedValueOnce("error");
    expect((await post()).status).toBe(200);
    expect(row()).toMatchObject({
      sent_endpoints: ["device-a"],
      delivered_at: null,
      processing_token: null,
    });
    mocks.send.mockClear();
    await post();
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0].endpoint).toBe("device-b");
    expect(row().delivered_at).not.toBeNull();
  });

  it("en aktiv paus lämnar kön orörd och utskicket fortsätter efter pausens slut", async () => {
    tables.user_kv = [
      {
        user_id: "owner-a",
        key: "myflove-quiet-mode",
        value: { pausedUntil: Date.now() + 60_000 },
      },
    ];
    await post();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(row().delivered_at).toBeNull();
    vi.setSystemTime(new Date("2026-10-11T12:02:00Z"));
    await post();
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(row().delivered_at).not.toBeNull();
  });

  it("telefonens natt gäller på servern även när serverklockan är UTC", async () => {
    vi.setSystemTime(new Date("2026-10-11T20:30:00Z"));
    tables.user_kv = [
      {
        user_id: "owner-a",
        key: "myflove-quiet-mode",
        value: {
          scheduleEnabled: true,
          scheduleStart: "22:00",
          scheduleEnd: "07:00",
          timeZone: "Europe/Stockholm",
        },
      },
    ];
    await post();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(row().delivered_at).toBeNull();
  });

  it("en andra cron-körning kan inte skicka samma låsta påminnelse", async () => {
    let release!: (value: string) => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    mocks.send.mockImplementationOnce(() => {
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const first = post();
    await started;
    await post();
    expect(mocks.send).toHaveBeenCalledOnce();
    release("ok");
    await first;
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("läser färska enhetskvitton när en tidigare körning hann klart efter första läsningen", async () => {
    beforeClaim = () => {
      row().sent_endpoints = ["device-a"];
    };
    await post();
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0].endpoint).toBe("device-b");
  });

  it("kvitterar inte en påminnelse när det saknas registrerade enheter", async () => {
    tables.push_subscriptions = [];
    await post();
    expect(row().delivered_at).toBeNull();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("avbokar dygnsgamla larm utan att låtsas att de levererats", async () => {
    row().deliver_at = "2026-10-10T11:00:00.000Z";
    await post();
    expect(row().canceled_at).not.toBeNull();
    expect(row().delivered_at).toBeNull();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
