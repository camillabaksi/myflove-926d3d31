import { describe, expect, it, vi } from "vitest";
import { createPushQuietChecker } from "./push-quiet.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function database(rows: Record<string, unknown>, error: unknown = null) {
  const read = vi.fn(async (id: string) => ({
    data: rows[id] ? { value: rows[id] } : null,
    error,
  }));
  const db = {
    from: () => {
      let user = "";
      const query = {
        select: () => query,
        eq: (key: string, value: string) => {
          if (key === "user_id") user = value;
          return query;
        },
        maybeSingle: () => read(user),
      };
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { db, read };
}

describe("bakgrundsnotiser respekterar kontots tysta läge", () => {
  it("skiljer på konton och läser varje konto bara en gång per tick", async () => {
    const { db, read } = database({ a: { pausedUntil: Date.parse("2026-10-11T13:00Z") } });
    const quiet = createPushQuietChecker(db, new Date("2026-10-11T12:00Z"));
    expect(await quiet("a")).toBe(true);
    expect(await quiet("b")).toBe(false);
    expect(await quiet("a")).toBe(true);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it("nytt tick läser om pausen så att notiser kan fortsätta efteråt", async () => {
    const { db } = database({ a: { pausedUntil: Date.parse("2026-10-11T13:00Z") } });
    expect(await createPushQuietChecker(db, new Date("2026-10-11T12:00Z"))("a")).toBe(true);
    expect(await createPushQuietChecker(db, new Date("2026-10-11T13:01Z"))("a")).toBe(false);
  });
  it("skickar inte förbi tyst läge om inställningen tillfälligt inte kan läsas", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = database({}, { message: "offline" });
    expect(await createPushQuietChecker(db, new Date())("a")).toBe(true);
    log.mockRestore();
  });
});
