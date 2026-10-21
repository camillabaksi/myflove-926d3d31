import { describe, expect, it } from "vitest";
import { daySummaryLines } from "@/lib/day-summary";

describe("daySummaryLines", () => {
  it("visar aldrig noll eller krav när inget hänt", () => {
    expect(daySummaryLines({ completedToday: 0, energyGivers: 0, checkedIn: false })).toEqual([
      "Inget behöver vara gjort för att dagen ska räknas.",
    ]);
  });
  it("beskriver det som faktiskt gjorts", () => {
    expect(daySummaryLines({ completedToday: 3, energyGivers: 1, checkedIn: true })).toEqual([
      "Du har gjort 3 saker idag.",
      "En sak har gett dig energi.",
      "Du har checkat in hur du mår – bra koll på dig själv.",
    ]);
  });
});
