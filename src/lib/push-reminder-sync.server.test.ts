import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown): unknown => value;
    const builder = {
      middleware: () => builder,
      inputValidator: (fn: typeof validate) => {
        validate = fn;
        return builder;
      },
      handler:
        (fn: (args: Record<string, unknown>) => unknown) => (args: Record<string, unknown>) =>
          fn({ ...args, data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { syncReminder } from "./push.functions";

const data = {
  clientKey: "task:one",
  kind: "task",
  title: "Test",
  body: "Kl 13:00",
  deliverAt: "2026-10-11T13:00:00.000Z",
  url: "/idag",
};
let existing: Record<string, unknown> | null;
let readError: { message: string } | null;
const upsert = vi.fn();
const filters: Record<string, unknown> = {};
const context = {
  userId: "owner-a",
  supabase: {
    from: () => {
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        maybeSingle: async () => ({ data: existing, error: readError }),
        upsert,
      };
      return chain;
    },
  },
};
const call = syncReminder as unknown as (args: {
  data: typeof data;
  context: typeof context;
}) => Promise<unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  readError = null;
  upsert.mockResolvedValue({ error: null });
  existing = {
    title: data.title,
    body: data.body,
    kind: data.kind,
    deliver_at: "2026-10-11T15:00:00+02:00",
    url: data.url,
    canceled_at: null,
    delivered_at: "2026-10-11T13:01:00Z",
    sent_endpoints: ["device-a"],
  };
});

describe("påminnelsesynk får inte återställa leveranskvitton", () => {
  it("bevarar ett levererat utskick när periodisk synk skickar samma payload", async () => {
    await call({ data, context });
    expect(upsert).not.toHaveBeenCalled();
    expect(existing!.sent_endpoints).toEqual(["device-a"]);
    expect(filters).toMatchObject({ user_id: "owner-a", client_key: "task:one" });
  });
  it("ett nytt klockslag får nya kvitton och bryter den gamla körningens lås", async () => {
    await call({ data: { ...data, deliverAt: "2026-10-11T14:00:00.000Z" }, context });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "owner-a",
        delivered_at: null,
        sent_endpoints: [],
        processing_token: null,
        processing_until: null,
      }),
      { onConflict: "user_id,client_key" },
    );
  });
  it("en uttryckligen återaktiverad påminnelse kan köas på nytt", async () => {
    existing!.canceled_at = "2026-10-11T12:00:00Z";
    await call({ data, context });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ canceled_at: null, sent_endpoints: [] }),
      expect.anything(),
    );
  });
  it("ersätter inget när den befintliga radens status inte kunde läsas", async () => {
    readError = { message: "Offline" };
    await expect(call({ data, context })).rejects.toThrow("Offline");
    expect(upsert).not.toHaveBeenCalled();
  });
});
