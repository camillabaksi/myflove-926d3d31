import { describe, expect, it } from "vitest";
import { flowHomePrompt, type FlowHomeInput } from "@/lib/flow-home";

const base: FlowHomeInput = {
  hour: 9,
  isSunday: false,
  ork10: null,
  hasStale: false,
  hasPendingEnergy: false,
  order: ["quickflow", "batteri", "kalender"],
};

describe("flowHomePrompt", () => {
  it("ger samma neutrala hälsning med fyra val som grund", () => {
    const p = flowHomePrompt(base);
    expect(p.mode).toBe("halsning");
    expect(p.choices).toEqual(["quickflow", "batteri", "kalender", "valj"]);
  });

  it("frågar om energipåverkan först av allt", () => {
    const p = flowHomePrompt({ ...base, hasPendingEnergy: true, hasStale: true, ork10: 2 });
    expect(p.mode).toBe("energi");
    expect(p.choices).toHaveLength(0);
  });

  it("frågar varsamt om det som blivit liggande", () => {
    const p = flowHomePrompt({ ...base, hasStale: true });
    expect(p.mode).toBe("liggande");
    expect(p.message).toContain("liggande");
    expect(p.message).not.toContain("glöm");
  });

  it("erbjuder färre val vid låg ork", () => {
    const p = flowHomePrompt({ ...base, ork10: 3 });
    expect(p.mode).toBe("lag-ork");
    expect(p.choices).toHaveLength(2);
  });

  it("lyfter veckoöversikten på söndagar", () => {
    const p = flowHomePrompt({ ...base, isSunday: true, ork10: 8 });
    expect(p.choices[0]).toBe("vecka");
  });

  it("följer den adaptiva ordningen", () => {
    const p = flowHomePrompt({ ...base, order: ["kalender", "quickflow", "batteri"] });
    expect(p.choices[0]).toBe("kalender");
  });
});
