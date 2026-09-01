import { describe, it, expect } from "vitest";
import { energyFingerprint, splitAlreadyMigrated } from "@/lib/energy-pending";

describe("väntande energiloggar", () => {
  it("ger samma fingeravtryck för samma sekund och nivå", () => {
    expect(energyFingerprint({ level: 3, logged_at: "2026-09-01T10:00:00.000Z" })).toBe(
      energyFingerprint({ level: 3, logged_at: "2026-09-01T10:00:00.500Z" }),
    );
  });

  it("hoppar över poster som redan finns i molnet", () => {
    const pending = [
      { id: "a", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "b", level: 4, logged_at: "2026-09-01T11:00:00.000Z" },
    ];
    const cloud = [{ level: 3, logged_at: "2026-09-01T10:00:00.000Z" }];

    const { toInsert, alreadyThere } = splitAlreadyMigrated(pending, cloud);

    expect(alreadyThere.map((e) => e.id)).toEqual(["a"]);
    expect(toInsert.map((e) => e.id)).toEqual(["b"]);
  });

  it("skapar inte dubbletter inom samma kö", () => {
    const pending = [
      { id: "a", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
      { id: "b", level: 3, logged_at: "2026-09-01T10:00:00.000Z" },
    ];

    const { toInsert, alreadyThere } = splitAlreadyMigrated(pending, []);

    expect(toInsert).toHaveLength(1);
    expect(alreadyThere).toHaveLength(1);
  });
});
