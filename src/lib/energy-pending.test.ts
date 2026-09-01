import { describe, it, expect, vi, beforeEach } from "vitest";

/** Enkel in-memory-mock av energy_logs. */
const cloudRows: { id: string; level: number; logged_at: string; user_id: string }[] = [];
let failNext = 0;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: cloudRows.map(({ id, level, logged_at }) => ({ id, level, logged_at })),
            error: null,
          }),
      }),
      upsert: (payload: { id: string; level: number; logged_at: string; user_id: string }) => ({
        select: () => ({
          single: () => {
            if (failNext > 0) {
              failNext -= 1;
              return Promise.resolve({ data: null, error: { message: "network" } });
            }
            const idx = cloudRows.findIndex((r) => r.id === payload.id);
            if (idx >= 0) cloudRows[idx] = payload;
            else cloudRows.push(payload);
            const { id, level, logged_at } = payload;
            return Promise.resolve({ data: { id, level, logged_at }, error: null });
          },
        }),
      }),
    }),
  },
}));

const { ensurePendingUuids, isUuid, splitAlreadyMigrated, migratePendingEnergy } =
  await import("@/lib/energy-pending");

beforeEach(() => {
  cloudRows.length = 0;
  failNext = 0;
});

describe("väntande energiloggar", () => {
  it("ger äldre poster utan UUID varsitt eget UUID", () => {
    const { entries, changed } = ensurePendingUuids([
      { id: "1", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "2", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
    ]);
    expect(changed).toBe(true);
    expect(entries.every((e) => isUuid(e.id))).toBe(true);
    expect(entries[0].id).not.toBe(entries[1].id);
    expect(entries[0].logged_at).toBe("2026-09-01T10:00:00.000Z");
  });

  it("hoppar över poster vars id redan finns i molnet", () => {
    const pending = [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        level: 3,
        logged_at: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        level: 4,
        logged_at: "2026-09-01T11:00:00.000Z",
      },
    ];
    const { toInsert, alreadyThere } = splitAlreadyMigrated(pending, [{ id: pending[0].id }]);
    expect(alreadyThere.map((e) => e.id)).toEqual([pending[0].id]);
    expect(toInsert.map((e) => e.id)).toEqual([pending[1].id]);
  });

  // TEST 1
  it("bevarar två identiska äldre poster som två separata observationer", async () => {
    const pending = [
      { id: "old-1", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "old-2", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
    ];
    const result = await migratePendingEnergy("u1", pending, []);
    expect(result.migrated).toHaveLength(2);
    expect(result.remaining).toHaveLength(0);
    expect(cloudRows).toHaveLength(2);
    expect(new Set(cloudRows.map((r) => r.id)).size).toBe(2);
    expect(
      cloudRows.every((r) => r.logged_at === "2026-09-01T10:00:00.000Z" && r.level === 3),
    ).toBe(true);
  });

  // TEST 2
  it("skapar inga dubbletter när migreringen körs två gånger", async () => {
    const pending = [
      { id: "old-1", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "old-2", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
    ];
    const first = await migratePendingEnergy("u1", pending, []);
    const second = await migratePendingEnergy("u1", first.normalized, []);
    expect(second.migrated).toHaveLength(2);
    expect(second.remaining).toHaveLength(0);
    expect(cloudRows).toHaveLength(2);
  });

  // TEST 3
  it("återupptar en avbruten migrering utan att skapa dubbletter", async () => {
    const pending = [
      { id: "old-1", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "old-2", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
    ];
    failNext = 1; // första posten misslyckas
    const first = await migratePendingEnergy("u1", pending, []);
    expect(cloudRows).toHaveLength(1);
    expect(first.remaining).toHaveLength(1);

    // Kön som sparats lokalt innehåller de stabila UUID:na.
    const queue = first.normalized.filter((e) => first.remaining.some((r) => r.id === e.id));
    const second = await migratePendingEnergy("u1", queue, []);
    expect(second.remaining).toHaveLength(0);
    expect(cloudRows).toHaveLength(2);
    expect(new Set(cloudRows.map((r) => r.id)).size).toBe(2);
  });

  // TEST 4
  it("lämnar nya poster med UUID orörda", async () => {
    const uuid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const result = await migratePendingEnergy(
      "u1",
      [{ id: uuid, level: 5, logged_at: "2026-09-01T12:00:00.000Z" }],
      [],
    );
    expect(result.normalized[0].id).toBe(uuid);
    expect(cloudRows[0].id).toBe(uuid);
  });
});
