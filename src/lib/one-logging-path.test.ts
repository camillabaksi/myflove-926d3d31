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

  it("Hem har ett enda lägeskort som loggar och leder till samma centrala vy", () => {
    const home = read("src/pages/home.tsx");
    // Ett enda kort på Hem – kapacitetsvalet loggar även dagens ork.
    expect(home).toContain("CapacityPlanCard");
    expect(home).toContain('"/mitt-batteri"');
    // Inga dubbla loggningsrutor på Hem.
    expect(home).not.toContain("simple-checkin");
    expect(home).not.toContain("QuickLogButton");
    expect(home).not.toContain("EnergyBattery");
    // Självaste loggningen sker i kapacitetsväljaren (samma dataväg som Mitt batteri).
    const selector = read("src/components/capacity-selector.tsx");
    expect(selector).toContain("logEnergy");
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
