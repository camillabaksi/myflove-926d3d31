import { describe, expect, it } from "vitest";
import { completedBelongsToDay } from "@/lib/flow-items";

/** Avklarade poster ska ligga kvar på sitt planerade datum – inte flytta till idag. */
describe("completedBelongsToDay", () => {
  const today = "2026-09-02";

  it("visar inte en avklarad kalenderpost från ett tidigare datum under idag", () => {
    // "APT på förskolan" 2026-08-25, avbockad idag.
    expect(completedBelongsToDay(today, "2026-08-25", Date.parse("2026-09-02T09:00:00"))).toBe(
      false,
    );
  });

  it("visar posten kvar på sitt ursprungliga datum", () => {
    expect(
      completedBelongsToDay("2026-08-25", "2026-08-25", Date.parse("2026-09-02T09:00:00")),
    ).toBe(true);
  });

  it("visar dagens avklarade poster", () => {
    expect(completedBelongsToDay(today, today, Date.parse("2026-09-02T08:00:00"))).toBe(true);
  });

  it("datumlösa poster hör till dagen de bockades av", () => {
    const noon = new Date(2026, 8, 2, 12, 0, 0).getTime();
    expect(completedBelongsToDay(today, undefined, noon)).toBe(true);
    expect(completedBelongsToDay("2026-09-01", undefined, noon)).toBe(false);
    expect(completedBelongsToDay(today, undefined, undefined)).toBe(false);
  });

  it("påverkas inte av UTC-skiften (sen kväll lokalt)", () => {
    const lateEvening = new Date(2026, 8, 2, 23, 30, 0).getTime();
    expect(completedBelongsToDay(today, undefined, lateEvening)).toBe(true);
  });
});
