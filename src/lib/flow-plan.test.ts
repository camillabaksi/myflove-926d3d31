import { describe, expect, it } from "vitest";
import { buildFlowPlan, flowPlanContext, orderForNow } from "@/lib/flow-plan";
import { prioritize, type CapacityMode } from "@/lib/priority-engine";

const today = "2026-09-25";
const at = (h: number, m = 0) => h * 60 + m;

// 2×P1, 3×P2, 3×P3, 2×P4 – en fast tid och ett beroende (handla → laga middag).
const items = [
  { id: "a", title: "Laga middag" },
  { id: "b", title: "Läkartid vårdcentralen", time: "09:00" },
  { id: "c", title: "Hämta barnen på förskolan" },
  { id: "d", title: "Handla mat" },
  { id: "e", title: "Förbered matlåda" },
  { id: "f", title: "Ring mormor" },
  { id: "g", title: "Vattna blommor" },
  { id: "h", title: "Boka frisör" },
  { id: "i", title: "Organisera garderoben" },
  { id: "j", title: "Rensa bilder" },
];

const MODES: CapacityMode[] = ["fullt", "mellan", "lagt"];
const plan = (mode: CapacityMode, now = at(7)) =>
  buildFlowPlan(items, { mode, today, nowMinutes: now });
const priorities = (p: ReturnType<typeof plan>) =>
  Object.fromEntries(
    [...p.order, ...p.extras, ...p.waiting].map((x) => [x.item.id, x.priority]),
  );

describe("FlowPlan – prioritet + kapacitet", () => {
  it("testuppsättningen är P1×2, P2×3, P3×3, P4×2", () => {
    const count = [1, 2, 3, 4].map(
      (n) => prioritize(items, today).filter((x) => x.priority === n).length,
    );
    expect(count).toEqual([2, 3, 3, 2]);
  });

  it("P1–P4 är desamma i alla lägen", () => {
    const [f, m, l] = MODES.map((mode) => priorities(plan(mode)));
    expect(m).toEqual(f);
    expect(l).toEqual(f);
  });

  it("mängden krymper: Fullt > Mellan > Lågt", () => {
    const [f, m, l] = MODES.map((mode) => plan(mode).order.length);
    expect(f).toBeGreaterThan(m);
    expect(m).toBeGreaterThan(l);
    expect(l).toBe(2); // bara P1 när inget P2 måste ske idag
  });

  it("Lågt ger ett enda beslut: Nu, inget Sedan", () => {
    const p = plan("lagt");
    expect(p.now).not.toBeNull();
    expect(p.next).toBeNull();
    expect(p.parallel).toBeNull();
    expect(p.message).toBe("Det räcker just nu.");
  });

  it("beroende respekteras: handla före laga middag", () => {
    const ids = plan("fullt").order.map((p) => p.item.id);
    expect(ids.indexOf("d")).toBeLessThan(ids.indexOf("a"));
  });

  it("fast tid som snart börjar blir Nu", () => {
    expect(plan("fullt", at(8, 45)).now?.item.id).toBe("b");
    expect(plan("lagt", at(8, 45)).now?.item.id).toBe("b");
  });

  it("fast tid långt fram går inte före annat P1", () => {
    expect(plan("mellan", at(7)).now?.item.id).toBe("c");
  });

  it("förberedelser före fast tid ligger i tidsordning", () => {
    const morning = prioritize(
      [
        { id: "x", title: "Läkartid", time: "09:00" },
        { id: "y", title: "Gå hemifrån", time: "08:30" },
        { id: "z", title: "Klä på dig", time: "08:15" },
      ],
      today,
    );
    expect(orderForNow(morning, at(8)).map((p) => p.item.id)).toEqual(["z", "y", "x"]);
  });

  it("morgonkedja går aldrig baklänges", () => {
    const p = buildFlowPlan(
      [
        { id: "3", title: "Lämna barn på förskolan" },
        { id: "2", title: "Gå till bussen" },
        { id: "1", title: "Packa väskan" },
      ],
      { mode: "fullt", today, nowMinutes: at(7) },
    );
    expect(p.order.map((x) => x.item.id)).toEqual(["1", "2", "3"]);
  });

  it("Inte nu flyttar saken sist och ger nästa som Nu", () => {
    const first = plan("mellan").now!.item.id;
    const p = buildFlowPlan(items, { mode: "mellan", today, nowMinutes: at(7), skip: [first] });
    expect(p.now?.item.id).not.toBe(first);
    expect(p.order.at(-1)?.item.id).toBe(first);
  });

  it("Flow-kontexten innehåller samma Nu som planen", () => {
    const p = plan("mellan");
    expect(flowPlanContext(p)).toContain(`Nu: ${p.now!.item.title}`);
    expect(flowPlanContext(plan("lagt"))).not.toContain("Sedan:");
  });
});

describe("FlowPlan – batteri-isolering", () => {
  it("gamla batteri-/energivärden på uppgifterna ändrar inte planen", () => {
    const withBattery = (energy: number, battery: number) =>
      items.map((i) => ({ ...i, energy, energyImpact: "drains", battery, flowScore: battery }));
    for (const mode of MODES) {
      const a = buildFlowPlan(withBattery(1, 5), { mode, today, nowMinutes: at(7) });
      const b = buildFlowPlan(withBattery(10, 95), { mode, today, nowMinutes: at(7) });
      const ids = (p: typeof a) => ({
        now: p.now?.item.id,
        next: p.next?.item.id,
        order: p.order.map((x) => [x.item.id, x.priority]),
        waiting: p.waiting.map((x) => x.item.id),
      });
      expect(ids(a)).toEqual(ids(b));
    }
  });
});
