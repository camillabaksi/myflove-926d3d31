import { describe, expect, it } from "vitest";
import { parseQuickflowDateTime } from "./quickflow-datetime";

// Torsdag 1 oktober 2026 kl 12:00
const NOW = new Date(2026, 9, 1, 12, 0);

describe("parseQuickflowDateTime", () => {
  it("tolkar veckodag och tidsintervall", () => {
    const r = parseQuickflowDateTime("tvätta fredag 10-14", NOW);
    expect(r).not.toBeNull();
    expect(r!.title).toBe("tvätta");
    expect(r!.date).toBe("2026-10-02"); // fredagen efter torsdag 1 okt
    expect(r!.startTime).toBe("10:00");
    expect(r!.endTime).toBe("14:00");
  });

  it("tolkar explicit datum med klockslag", () => {
    const r = parseQuickflowDateTime("tandläkaren 12 oktober kl 14", NOW);
    expect(r!.date).toBe("2026-10-12");
    expect(r!.startTime).toBe("14:00");
    expect(r!.endTime).toBeNull();
    expect(r!.title).toBe("tandläkaren");
  });

  it("tolkar numeriskt datum", () => {
    const r = parseQuickflowDateTime("möte 10/10 14:00", NOW);
    expect(r!.date).toBe("2026-10-10");
    expect(r!.startTime).toBe("14:00");
  });

  it("nästa fredag på en fredag blir om en vecka", () => {
    const fredag = new Date(2026, 9, 2, 12, 0);
    const r = parseQuickflowDateTime("ring tandläkaren nästa fredag", fredag);
    expect(r!.date).toBe("2026-10-09");
  });

  it("imorgon och idag funkar", () => {
    expect(parseQuickflowDateTime("handla imorgon", NOW)!.date).toBe("2026-10-02");
    expect(parseQuickflowDateTime("andas idag", NOW)!.date).toBe("2026-10-01");
  });

  it("datum utan tid ger ingen tid", () => {
    const r = parseQuickflowDateTime("boka hotell 5 november", NOW);
    expect(r!.date).toBe("2026-11-05");
    expect(r!.startTime).toBeNull();
  });

  it("passerat datum i år flyttas till nästa år", () => {
    const r = parseQuickflowDateTime("fira 20 september", NOW);
    expect(r!.date).toBe("2027-09-20");
  });

  it("text utan datum ger null", () => {
    expect(parseQuickflowDateTime("handla mjölk", NOW)).toBeNull();
  });
});
