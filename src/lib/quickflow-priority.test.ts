import { describe, expect, it } from "vitest";
import { energyHint, heuristicPriority, sortPriority, splitTasks } from "@/lib/quickflow-priority";

describe("quickflow-priority", () => {
  it("delar upp flera saker i ett fält", () => {
    expect(splitTasks("Tvätta, handla och diska")).toEqual(["Tvätta", "handla", "diska"]);
    expect(splitTasks("Tvätta\nHandla\n- Diska")).toEqual(["Tvätta", "Handla", "Diska"]);
  });

  it("prioriterar små saker högre när energin är låg", () => {
    const low = heuristicPriority(["Storstäda", "Diska"], 20);
    const idx = (t: string) => low.findIndex((i) => i.title === t);
    expect(idx("Diska")).toBeLessThan(idx("Storstäda"));
  });

  it("räknar med batteriet: tunga saker tidigare när energin är hög", () => {
    const idx = (list: ReturnType<typeof heuristicPriority>, t: string) =>
      list.findIndex((i) => i.title === t);
    const low = heuristicPriority(["Städa", "Tvätta"], 20);
    expect(idx(low, "Tvätta")).toBeLessThan(idx(low, "Städa"));
    const high = heuristicPriority(["Städa", "Tvätta"], 90);
    expect(idx(high, "Städa")).toBeLessThan(idx(high, "Tvätta"));
    expect(high.find((i) => i.title === "Städa")?.why).toContain("batteriet är högt");
  });

  it("lägger brådskande saker i Gör nu", () => {
    const res = heuristicPriority(["Betala räkningen", "Vattna blommor"], 60);
    expect(res[0]?.bucket).toBe("nu");
  });

  it("anpassar hjälptexten efter batteriet", () => {
    expect(energyHint(20)).toContain("lite energi");
    expect(energyHint(90)).toContain("gott om energi");
  });

  it("sorterar efter nivå", () => {
    const items = heuristicPriority(["Diska", "Betala räkningen"], 60);
    expect(sortPriority(items)[0]?.title).toBe("Betala räkningen");
  });
});
