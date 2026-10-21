import { describe, expect, it } from "vitest";
import { daySummaryLines, waitingCapturesLine } from "@/lib/day-summary";

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

describe("waitingCapturesLine", () => {
  it("visas inte när inget väntar", () => expect(waitingCapturesLine(0, 20)).toBeNull());
  it("dag och kväll", () => {
    expect(waitingCapturesLine(3, 10)).toBe("3 fångade tankar väntar, när det passar dig.");
    expect(waitingCapturesLine(1, 19)).toBe("1 fångad tanke väntar – vill du titta på den innan dagen är slut?");
  });
});
