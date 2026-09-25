import { describe, expect, it } from "vitest";
import {
  CAPACITY_PERCENT,
  capacityFromOrk10,
  planForCapacity,
  prioritize,
  type CapacityMode,
} from "@/lib/priority-engine";
import { orkFromValue10, ORK_LEVELS } from "@/lib/ork";
import { readCapacity, DEFAULT_CAPACITY } from "@/hooks/use-capacity-mode";

const today = "2026-09-25";
const items = [
  "Ta medicin",
  "Hämta barnen på förskolan",
  "Handla mat idag",
  "Förbered matlåda",
  "Läxa matte",
  "Ring mormor",
  "Vattna blommor",
  "Boka frisör",
  "Organisera garderoben",
  "Rensa bilder",
].map((title, i) => ({ id: `t${i}`, title }));

describe("kapacitetsmodell", () => {
  it("testuppsättningen är P1×2, P2×3, P3×3, P4×2", () => {
    const count = [1, 2, 3, 4].map((p) => prioritize(items, today).filter((x) => x.priority === p).length);
    expect(count).toEqual([2, 3, 3, 2]);
  });

  it("kapaciteten ändrar mängden i planen – aldrig prioriteten", () => {
    const plans = (["fullt", "mellan", "lagt"] as CapacityMode[]).map((m) => planForCapacity(items, m, today));
    const [full, mid, low] = plans;
    expect(full.planned.length).toBe(8);
    expect(full.extras.length).toBe(2);
    expect(mid.planned.length).toBe(4);
    expect(low.planned.map((p) => p.item.title)).toEqual([
      "Ta medicin",
      "Hämta barnen på förskolan",
      "Handla mat idag",
    ]);
    expect(full.planned.length).toBeGreaterThan(mid.planned.length);
    expect(mid.planned.length).toBeGreaterThan(low.planned.length);
    const prio = (plan: (typeof plans)[number]) =>
      Object.fromEntries([...plan.planned, ...plan.extras, ...plan.deferred].map((p) => [p.item.id, p.priority]));
    expect(prio(mid)).toEqual(prio(full));
    expect(prio(low)).toEqual(prio(full));
  });

  it("gamla orkvärden läses som Fullt/Mellan/Lågt", () => {
    expect(capacityFromOrk10(9)).toBe("fullt"); // Mycket
    expect(capacityFromOrk10(7)).toBe("mellan"); // Okej
    expect(capacityFromOrk10(4)).toBe("lagt"); // Lite
    expect(capacityFromOrk10(2)).toBe("lagt"); // Nästan slut
    expect(capacityFromOrk10(null)).toBeNull();
    expect(orkFromValue10(7)?.label).toBe("Mellan");
    expect(ORK_LEVELS.map((l) => l.label)).toEqual(["Fullt", "Mellan", "Lågt"]);
    for (const l of ORK_LEVELS) expect(capacityFromOrk10(l.value10)).toBe(l.id);
  });

  it("användarens val är källan – gammalt/okänt värde ger Mellan", () => {
    expect(readCapacity({ date: "2026-01-01", mode: "lagt" })).toBe("lagt");
    expect(readCapacity({ date: "", mode: null })).toBeNull();
    expect(readCapacity({ mode: "okänt" as CapacityMode })).toBeNull();
    expect(DEFAULT_CAPACITY).toBe("mellan");
    expect(CAPACITY_PERCENT.lagt).toBeLessThan(40);
  });
});
