import { describe, expect, it } from "vitest";
import { energyHint, heuristicPriority, sortPriority, splitTasks, BUCKETS, bucketRank } from "@/lib/quickflow-priority";
import {
  bucketToPriority,
  classifyPriority,
  normalizeBucket,
  priorityToBucket,
} from "@/lib/priority-engine";

describe("quickflow-priority", () => {
  it("delar upp flera saker i ett fält", () => {
    expect(splitTasks("Tvätta, handla och diska")).toEqual(["Tvätta", "handla", "diska"]);
    expect(splitTasks("Tvätta\nHandla\n- Diska")).toEqual(["Tvätta", "Handla", "Diska"]);
  });

  it("översätter gamla bucket-värden till P1–P4", () => {
    expect(bucketToPriority("nu")).toBe(1);
    expect(bucketToPriority("sedan")).toBe(2);
    expect(bucketToPriority("kan-vanta")).toBe(3);
    expect(bucketToPriority("om-du-orkar")).toBe(4);
    expect(bucketToPriority("okänt")).toBe(3);
    expect(normalizeBucket(undefined)).toBe("kan-vanta");
    for (const p of [1, 2, 3, 4] as const) expect(bucketToPriority(priorityToBucket(p))).toBe(p);
  });

  it("ordnar nivåerna P1 → P4", () => {
    expect(BUCKETS).toEqual(["nu", "sedan", "kan-vanta", "om-du-orkar"]);
    expect(bucketRank("om-du-orkar")).toBe(3);
  });

  it("heuristiken ger samma P-nivå som prioritetsmotorn", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const title of ["Betala räkningen idag", "Handla mat", "Organisera garderoben", "Vattna blommor"]) {
      const [res] = heuristicPriority([title]);
      expect(bucketToPriority(res?.bucket)).toBe(classifyPriority({ id: "x", title }, today).priority);
    }
  });

  it("batteriet ändrar aldrig prioriteten", () => {
    const low = heuristicPriority(["Storstäda", "Handla mat"], 10).map((i) => i.bucket);
    const high = heuristicPriority(["Storstäda", "Handla mat"], 95).map((i) => i.bucket);
    expect(low).toEqual(high);
  });

  it("anpassar hjälptexten efter batteriet", () => {
    expect(energyHint(20)).toContain("lite energi");
    expect(energyHint(90)).toContain("gott om energi");
  });

  it("sorterar efter nivå", () => {
    const items = heuristicPriority(["Vattna blommor", "Betala räkningen idag"]);
    expect(sortPriority(items)[0]?.title).toBe("Betala räkningen idag");
  });
});
