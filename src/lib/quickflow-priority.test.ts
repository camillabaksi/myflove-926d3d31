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
