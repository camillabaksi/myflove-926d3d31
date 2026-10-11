import { describe, expect, it } from "vitest";
import { translate, LANGUAGE_KEY } from "./i18n";
import { readFileSync } from "node:fs";

describe("approved first Pace text stage", () => {
  it("separates the companion from deterministic day pace in both languages", () => {
    expect(translate("Pace", "sv")).toBe("Pace");
    expect(translate("Pace", "en")).toBe("Pace");
    expect(translate("Din takt", "sv")).toBe("Din takt");
    expect(translate("Din takt", "en")).toBe("Your pace");
    expect(translate("Varsamt", "en")).toBe("Gentle");
    expect(translate("Jämnt", "en")).toBe("Steady");
    expect(translate("Utrymme", "en")).toBe("Open");
  });
  it("provides English for new visible names without rewriting legacy keys", () => {
    for (const [sv, en] of [["Pace & samtal", "Pace & conversations"], ["Prata med Pace", "Talk to Pace"], ["Pace-inställningar", "Pace settings"], ["Pace tänker…", "Pace is thinking…"]]) {
      expect(translate(sv, "en")).toBe(en);
    }
    expect(translate("Flow", "en")).toBe("Pace");
    expect(translate("Dagens Pace", "en")).toBe("Today's Pace");
    expect(LANGUAGE_KEY).toBe("myflove-language");
  });
  it("keeps conversation IDs, destinations, actions and images behind the renamed labels", () => {
    const source = readFileSync("src/components/flow/assistant-content.tsx", "utf8");
    expect(source).toContain('const NEW_CHAT_FLAG = "myflove-flow-new-chat"');
    expect(source).toContain('to: "/assistant/$chatId"');
    expect(source).toContain('onClick={() => runAction(key, a)}');
    expect(source).toContain('<FlowMascot alt="Pace – Paceables följeslagare"');
    expect(source).toContain('Spara hos Pace?');
    expect(source).not.toContain('PaceCompanion');
  });
});
