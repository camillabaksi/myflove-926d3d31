import { describe, expect, it } from "vitest";
import {
  batteryLine,
  batteryTone,
  completionReaction,
  decisionPrompt,
  homeContextLine,
  missedTaskLine,
  recallPrefix,
} from "@/lib/flow-tone";

const SHAMING = /misslyck|ligger efter|du borde|för lite gjort|failed/i;

describe("batteryTone", () => {
  it("delar in energin i fyra lägen", () => {
    expect(batteryTone(90)).toBe("high");
    expect(batteryTone(55)).toBe("medium");
    expect(batteryTone(30)).toBe("low");
    expect(batteryTone(10)).toBe("verylow");
  });

  it("skuldbelägger aldrig", () => {
    for (const level of [0, 20, 40, 60, 80, 100]) {
      expect(batteryLine(level)).not.toMatch(SHAMING);
    }
  });
});

describe("decisionPrompt", () => {
  it("ger färre val vid låg energi", () => {
    expect(decisionPrompt(80)).toBe("Vad vill du göra?");
    expect(decisionPrompt(20)).toMatch(/lilla saken/);
  });
});

describe("homeContextLine", () => {
  const base = {
    hour: 13,
    battery: 60,
    completedToday: 0,
    remainingToday: 2,
    nextTitle: null,
    checkedIn: true,
  };

  it("hälsar på morgonen innan incheckning", () => {
    expect(homeContextLine({ ...base, hour: 8, checkedIn: false })).toMatch(/God morgon/);
  });

  it("lugnar ner vid mycket låg energi", () => {
    expect(homeContextLine({ ...base, battery: 10 })).toBe("Vi tar det lugnt idag.");
  });

  it("bekräftar flera avklarade saker", () => {
    expect(homeContextLine({ ...base, completedToday: 4 })).toMatch(/flera saker gjorda/);
  });

  it("nämner nästa sak mitt på dagen", () => {
    expect(homeContextLine({ ...base, nextTitle: "Duscha" })).toBe(
      "Du är mitt i dagen. Nästa är duscha.",
    );
  });

  it("landar dagen på kvällen", () => {
    expect(homeContextLine({ ...base, hour: 22, remainingToday: 0 })).toMatch(/klar för idag/);
  });

  it("är alltid deterministisk", () => {
    expect(homeContextLine(base)).toBe(homeContextLine(base));
  });
});

describe("completionReaction", () => {
  it("firar utan att pusha vid låg energi", () => {
    const r = completionReaction({ title: "Ring tandläkaren", battery: 20, remainingToday: 3 });
    expect(r.message).toMatch(/andas vi ut/);
    expect(r.message).toMatch(/axlarna/);
    expect(r.followUp).toBeUndefined();
  });

  it("landar mjukt även vid bra energi", () => {
    const r = completionReaction({ title: "Ring tandläkaren", battery: 85, remainingToday: 2 });
    expect(r.message).toMatch(/andas vi ut/);
    expect(r.followUp).toMatch(/axlarna/);
  });

  it("avslutar dagen när inget är kvar", () => {
    const r = completionReaction({ title: null, battery: 60, remainingToday: 0 });
    expect(r.message).toMatch(/klar för idag/);
  });
});

describe("missedTaskLine", () => {
  it("beskriver utan skuld och erbjuder val", () => {
    const line = missedTaskLine("Ring tandläkaren", 70);
    expect(line).not.toMatch(SHAMING);
    expect(line).toMatch(/flytta den eller släppa den/);
  });

  it("förenklar när energin är låg", () => {
    expect(missedTaskLine("Ring tandläkaren", 15)).toMatch(/gör det enklare/);
  });
});

describe("recallPrefix", () => {
  it("gör Flows minne synligt", () => {
    expect(recallPrefix("Mindre steg brukar fungera bättre för dig.")).toBe(
      "Jag minns: mindre steg brukar fungera bättre för dig.",
    );
  });

  it("hittar aldrig på minnen", () => {
    expect(recallPrefix(null)).toBeNull();
    expect(recallPrefix("   ")).toBeNull();
  });
});
