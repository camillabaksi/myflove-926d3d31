import { describe, expect, it } from "vitest";
import { flowDaySupport } from "./flow-day-support";
import type { CalendarEntry } from "./visual-calendar";

const own: CalendarEntry = { id: "a", sourceId: "a", date: "2026-10-07", title: "Test", source: "task", editable: true, done: false };
describe("contextual Flow support", () => {
  it("uses actual capacity without judging or fabricating it", () => {
    expect(flowDaySupport([], 42).message).toContain("42 %");
    expect(flowDaySupport([], null).message).not.toContain("%");
  });
  it("does not call a family-filled day quiet or count it as parental load", () => {
    const family = Array.from({ length: 3 }, (_, i) => ({ ...own, id: String(i), source: "child" as const, energyImpact: "drains" as const }));
    expect(flowDaySupport(family, null)).toMatchObject({ prioritize: false, message: expect.stringContaining("familjen") });
  });
  it("prioritizes explicit presence and known demanding plans", () => {
    expect(flowDaySupport([{ ...own, source: "child", requiresParent: true }, { ...own, source: "child", requiresParent: true }], null).message).toContain("där du behövs");
    expect(flowDaySupport(Array.from({ length: 5 }, () => ({ ...own, energyImpact: "drains" as const })), null).prioritize).toBe(true);
  });
  it("recognizes recovery and only claims gaps from known times", () => {
    expect(flowDaySupport([{ ...own, energyImpact: "gives" }], null).message).toContain("ger energi");
    expect(flowDaySupport([{ ...own, time: "08:00" }, { ...own, time: "10:00" }], null).message).not.toContain("luft");
    expect(flowDaySupport([{ ...own, time: "08:00", endTime: "09:00" }, { ...own, time: "10:00", endTime: "11:00" }], null).message).toContain("luft");
  });
});