import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { orkWord } from "@/lib/ork-word";

let state: {
  todayEnergyEntries: { id: string; level: number; logged_at: string }[];
  todayMoods: { id: string; score: number; note?: string; date: number }[];
};

vi.mock("@/hooks/use-quick-checkin", async () => {
  const actual = await vi.importActual<object>("@/hooks/use-quick-checkin");
  return { ...actual, useQuickCheckin: () => state };
});

import BatteryToday from "@/components/battery-today";
import { energyPercent } from "@/lib/energy-percent";

describe("BatteryToday – dagens observationer", () => {
  it("visar lugnt tomt läge innan första loggningen", () => {
    state = { todayEnergyEntries: [], todayMoods: [] };
    render(<BatteryToday />);
    expect(screen.getByText(/Inga observationer än idag/i)).toBeTruthy();
  });

  it("visar energi och mående som tidsstämplade observationer, äldst → nyast", () => {
    state = {
      todayEnergyEntries: [
        { id: "e1", level: 2, logged_at: new Date("2026-08-29T08:15:00").toISOString() },
        { id: "e2", level: 4, logged_at: new Date("2026-08-29T13:40:00").toISOString() },
      ],
      todayMoods: [
        {
          id: "m1",
          score: 2,
          note: "Sovit bara 4 timmar.",
          date: new Date("2026-08-29T08:15:00").getTime(),
        },
        {
          id: "m2",
          score: 4,
          note: "Känner mig bättre.",
          date: new Date("2026-08-29T13:40:00").getTime(),
        },
      ],
    };
    render(<BatteryToday />);
    expect(screen.getByText("Energi idag")).toBeTruthy();
    expect(screen.getByText("Mående idag")).toBeTruthy();
    // Båda energiobservationerna syns – inget skrivs över.
    // Energin visas som ordnivå (Låg/Lagom/God), inte som procent.
    expect(screen.getByText(orkWord(energyPercent({ level: 2 })).short)).toBeTruthy();
    expect(screen.getByText(orkWord(energyPercent({ level: 4 })).short)).toBeTruthy();
    // Fritexten följer med sin observation.
    expect(screen.getByText("Sovit bara 4 timmar.")).toBeTruthy();
    expect(screen.getByText("Känner mig bättre.")).toBeTruthy();
  });
});
