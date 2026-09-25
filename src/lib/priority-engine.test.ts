import { describe, expect, it } from "vitest";
import { planForCapacity, planSteps, prioritize, recalcMessage, simplifyTask } from "./priority-engine";

const today = "2026-09-25";
const base = [
  { id: "a", title: "Hämta barn", time: "16:30" },
  { id: "b", title: "Betala räkning idag" },
  { id: "c", title: "Handla mat" },
  { id: "d", title: "Dammsuga" },
  { id: "e", title: "Organisera garderoben" },
];
const titles = (l: { item: { title: string } }[]) => l.map((p) => p.item.title);

describe("prioritetsmotorn", () => {
  it("scenario 1 – klassar P1–P4", () => {
    const map = Object.fromEntries(prioritize(base, today).map((p) => [p.item.id, p.priority]));
    expect(map).toEqual({ a: 1, b: 1, c: 2, d: 3, e: 4 });
  });

  it("FULLT visar P1+P2+P3, P4 som extra", () => {
    const plan = planForCapacity(base, "fullt", today);
    expect(titles(plan.planned)).toEqual(["Hämta barn", "Betala räkning idag", "Handla mat", "Dammsuga"]);
    expect(titles(plan.extras)).toEqual(["Organisera garderoben"]);
  });

  it("scenario 2 – MELLAN flyttar dammsugning och garderob", () => {
    const plan = planForCapacity(base, "mellan", today);
    expect(titles(plan.planned)).toEqual(["Hämta barn", "Betala räkning idag", "Handla mat"]);
    expect(titles(plan.deferred)).toEqual(["Dammsuga", "Organisera garderoben"]);
  });

  it("scenario 3 – LÅGT behåller bara det nödvändiga", () => {
    const plan = planForCapacity(base, "lagt", today);
    expect(titles(plan.planned)).toEqual(["Hämta barn", "Betala räkning idag"]);
    expect(titles(plan.deferred)).toContain("Dammsuga");
    expect(titles(plan.deferred)).toContain("Organisera garderoben");
  });

  it("scenario 4 – tvättordning med parallell middag", () => {
    const plan = planForCapacity(
      [
        { id: "1", title: "Starta tvätt", time: "17:00" },
        { id: "2", title: "Laga middag" },
        { id: "3", title: "Häng tvätt" },
        { id: "4", title: "Vik tvätt" },
      ],
      "fullt",
      today,
    );
    expect(planSteps(plan.planned)).toEqual([
      "Starta tvätt först.",
      "Laga middag medan den går.",
      "Häng tvätt när maskinen är klar.",
      "Vik tvätt senare.",
    ]);
  });

  it("scenario 5 – sänkt läge räknar om och P1 ligger kvar", () => {
    const before = planForCapacity(base, "fullt", today);
    const after = planForCapacity(base, "lagt", today);
    expect(after.planned.length).toBeLessThan(before.planned.length);
    expect(titles(after.planned)).toContain("Hämta barn");
    expect(recalcMessage("fullt", "lagt")).toMatch(/förenklat/);
  });

  it("kontext: handla medicin blir P1, tvätta arbetskläder P2", () => {
    const p = prioritize(
      [
        { id: "m", title: "Handla medicin" },
        { id: "t", title: "Tvätta arbetskläder till imorgon" },
      ],
      today,
    );
    expect(p.find((x) => x.item.id === "m")?.priority).toBe(1);
    expect(p.find((x) => x.item.id === "t")?.priority).toBe(2);
  });

  it("förenklar efter läge", () => {
    expect(simplifyTask("Laga middag", "fullt")).toBeNull();
    expect(simplifyTask("Laga middag", "lagt")).toMatch(/enkelt/);
  });
});
