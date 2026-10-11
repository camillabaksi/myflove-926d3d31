import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

/**
 * Produktregel: energi och mående loggas på EN enda plats – Mitt batteri.
 * Testerna vaktar att inga parallella loggningsvägar smyger tillbaka.
 */
describe("En enda plats för energi & mående", () => {
  it("Mitt batteri-sidan innehåller den kanoniska loggningsvyn", () => {
    const battery = read("src/pages/battery.tsx");
    expect(battery).toContain("SimpleCheckin");
    expect(battery).toContain('source="mitt-batteri"');
  });

  it("Idag visar faktisk kapacitet och använder samma centrala loggning", () => {
    const today = read("src/pages/today.tsx");
    expect(today).toContain("TodayCapacity");
    expect(today).toContain("useDayCapacity");
    expect(today).not.toContain("CapacityPlanCard");
    expect(today).not.toContain("QuickLogButton");
    expect(today).not.toContain("EnergyBattery");
    const capacity = read("src/components/day/today-capacity.tsx");
    expect(capacity).toContain("SimpleCheckin");
    expect(capacity).not.toContain("useCapacityMode");
  });

  it("den gamla dubbletten QuickCheckin finns inte kvar", () => {
    expect(existsSync("src/components/quick-checkin.tsx")).toBe(false);
  });

  it("Flow-karusellen är borttagen – planering och chatt finns kvar", () => {
    expect(existsSync("src/components/flow/flow-deck.tsx")).toBe(false);
    expect(existsSync("src/components/flow/flow-plan-content.tsx")).toBe(true);
    expect(existsSync("src/components/flow/assistant-content.tsx")).toBe(true);
  });

  it("QuickFlow skapar ingen egen energiloggning", () => {
    const triage = read("src/components/quickflow-triage.tsx");
    expect(triage).not.toContain("addFactor");
    expect(triage).toContain("/mitt-batteri?note=");
  });

  it("historiken är read-only för nya loggningar", () => {
    expect(read("src/pages/battery.tsx")).toContain("<MoodContent showHeader={false} readOnly />");
    expect(read("src/pages/mood.tsx")).toContain("readOnly");
  });

  it("Flow får användarens egna ord som kontext utan att diagnostisera", () => {
    const ctx = read("src/hooks/use-flow-personal-context.ts");
    expect(ctx).toContain("Du har berättat");
    expect(ctx).toContain("inte en diagnos");
  });

  it("hälsodata blir aldrig automatiskt en aktivitet", () => {
    const checkin = read("src/components/simple-checkin.tsx");
    expect(checkin).not.toContain("addTask");
    expect(checkin).not.toContain("addReminder");
    expect(checkin).not.toContain("addEvent");
  });
});
