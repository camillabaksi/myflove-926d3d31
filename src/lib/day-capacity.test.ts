import { describe, expect, it } from "vitest";
import { dayCapacity } from "./day-capacity";
describe("dayCapacity", () => {
  it("saknar värde utan egen incheckning", () => {
    expect(dayCapacity("2026-10-07", {}, [], "2026-10-07").percent).toBeNull();
  });
  it("låter en senare logg uppdatera morgonens registrering", () => {
    const result = dayCapacity(
      "2026-10-07",
      { "2026-10-07": { morning: 10, morningLoggedAt: "2026-10-07T07:00:00" } },
      [{ level: 1, logged_at: "2026-10-07T12:00:00" }],
      "2026-10-07",
    );
    expect(result.percent).toBe(0);
    expect(result.source).toBe("energy-log");
    expect(result.morning).toBe(100);
  });
  it("använder en senare morgonregistrering framför en äldre logg", () => {
    const result = dayCapacity(
      "2026-10-07",
      { "2026-10-07": { morning: 10, morningLoggedAt: "2026-10-07T10:00:00" } },
      [{ level: 1, logged_at: "2026-10-07T08:00:00" }],
      "2026-10-07",
    );
    expect(result.percent).toBe(100);
    expect(result.source).toBe("morning");
  });
  it("läser äldre morgonposter men låter dem inte låsa en ny logg", () => {
    const edges = { "2026-10-07": { morning: 10 } };
    expect(dayCapacity("2026-10-07", edges, [], "2026-10-07").percent).toBe(100);
    expect(
      dayCapacity(
        "2026-10-07",
        edges,
        [{ level: 1, logged_at: "2026-10-07T12:00:00" }],
        "2026-10-07",
      ).percent,
    ).toBe(0);
  });
  it("sorterar registreringar efter tid även när tidszonerna skiljer sig", () => {
    const result = dayCapacity(
      "2026-10-07",
      {},
      [
        { level: 1, logged_at: "2026-10-07T10:00:00+02:00" },
        { level: 4, logged_at: "2026-10-07T09:00:00Z" },
      ],
      "2026-10-07",
    );
    expect(result.percent).toBe(75);
  });
  it("lånar inte gårdagens energi och använder inte ogiltiga loggar", () => {
    const result = dayCapacity(
      "2026-10-07",
      {},
      [
        { level: 5, logged_at: "2026-10-06T12:00:00" },
        { level: Number.NaN, logged_at: "2026-10-07T12:00:00" },
        { level: 4, logged_at: "fel" },
      ],
      "2026-10-07",
    );
    expect(result.percent).toBeNull();
  });
  it("använder senaste energiloggen samma dag när morgonvärde saknas", () => {
    expect(
      dayCapacity(
        "2026-10-07",
        {},
        [
          { level: 2, logged_at: "2026-10-07T08:00:00" },
          { level: 4, logged_at: "2026-10-07T12:00:00" },
        ],
        "2026-10-07",
      ).percent,
    ).toBe(75);
  });
  it("exponerar aldrig framtidsdaterad registrering", () => {
    expect(
      dayCapacity(
        "2026-10-08",
        { "2026-10-08": { morning: 10 } },
        [{ level: 5, logged_at: "2026-10-08T08:00:00" }],
        "2026-10-07",
      ).percent,
    ).toBeNull();
  });
});
