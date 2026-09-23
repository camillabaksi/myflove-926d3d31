import { describe, expect, it } from "vitest";
import { mergeMissingCloudEntries } from "@/lib/cloud-storage";

/** En gammal flik får aldrig radera saker som lagts till på en annan enhet. */
describe("mergeMissingCloudEntries", () => {
  it("lägger tillbaka poster som bara finns i molnet", () => {
    const local = [{ id: "a", title: "Handla" }];
    const cloud = [
      { id: "a", title: "Handla" },
      { id: "b", title: "Hämta tjejerna på föris" },
    ];
    expect(mergeMissingCloudEntries(local, cloud)).toEqual([
      { id: "b", title: "Hämta tjejerna på föris" },
      { id: "a", title: "Handla" },
    ]);
  });

  it("behåller lokala ändringar för poster som finns på båda ställena", () => {
    const local = [{ id: "a", title: "Handla", completed: true }];
    const cloud = [{ id: "a", title: "Handla", completed: false }];
    expect(mergeMissingCloudEntries(local, cloud)).toBe(local);
  });

  it("rör inte värden som inte är listor med id", () => {
    expect(mergeMissingCloudEntries({ x: 1 }, { y: 2 })).toEqual({ x: 1 });
    expect(mergeMissingCloudEntries(["a"], ["b"])).toEqual(["a"]);
  });
});
