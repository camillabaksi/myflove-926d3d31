import { describe, expect, it } from "vitest";
import { checkinContext } from "@/lib/flow-checkin-context";
import type { MoodEntry } from "@/hooks/use-data";
import type { EnergyLogEntry } from "@/hooks/use-quick-checkin";

const now = new Date(2026, 7, 31, 20, 0, 0);
const timestamp = (hour: number) => new Date(2026, 7, 31, hour, 15, 0).getTime();

const mood = (hour: number, score: number, note?: string): MoodEntry => ({
  id: `mood-${hour}`,
  score,
  date: timestamp(hour),
  ...(note ? { note } : {}),
});

const energy = (hour: number, level: number): EnergyLogEntry => ({
  id: `energy-${hour}`,
  level,
  logged_at: new Date(timestamp(hour)).toISOString(),
});

describe("checkinContext", () => {
  it("samlar dagens morgon-, dag- och kvällscheck-ins från befintliga observationer", () => {
    const context = checkinContext(
      [mood(13, 4), mood(8, 3, "Lite seg efter natten")],
      [energy(19, 3), energy(13, 4), energy(8, 2)],
      now,
    );

    expect(context).toContain("Dagens check-ins");
    expect(context).toContain("Morgon (kl. 08:15): energi 2/5, mående 3/5");
    expect(context).toContain("Egna ord: ”Lite seg efter natten”");
    expect(context).toContain("Dag (kl. 13:15): energi 4/5, mående 4/5");
    expect(context).toContain("Kväll (kl. 19:15): energi 3/5");
  });

  it("väljer den senaste observationen när ett tidsfönster innehåller flera loggningar", () => {
    const context = checkinContext([mood(9, 2), mood(10, 5)], [energy(10, 4), energy(9, 1)], now);

    expect(context).toContain("Morgon (kl. 10:15): energi 4/5, mående 5/5");
  });

  it("ignorerar observationer från andra dagar och visar en trygg tomstatus", () => {
    const yesterday = new Date(2026, 7, 30, 9, 0, 0);
    expect(checkinContext([mood(9, 5)], [energy(9, 5)], now)).toContain("Morgon");
    expect(
      checkinContext(
        [{ id: "old", score: 5, date: yesterday.getTime() }],
        [{ id: "old-energy", level: 5, logged_at: yesterday.toISOString() }],
        now,
      ),
    ).toContain("inte checkat in i dag ännu");
  });
});
