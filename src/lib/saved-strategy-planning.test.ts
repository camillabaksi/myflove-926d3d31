import { describe, expect, it } from "vitest";
import { addStrategyToPlanningDraft, strategyInPlanningDraft, personalSavedStrategies } from "./saved-strategy-planning";
import type { SavedStrategy } from "@/hooks/use-insight";

const support = (id: string, title: string, profileId?: string, source?: "demo" | "personal"): SavedStrategy => ({
  id, strategyId: id, title, areaId: "tid", contexts: ["vardag"],
  friction: 2, minutes: 5, nudges: [], profileId, source, addedAt: 1,
});

describe("Voluntary support across Today and Planera", () => {
  it("displays only saved personal supports and leaves source data unchanged", () => {
    const saved = [support("normal", "Gör tiden synlig"), support("demo", "Testa annat", "demo-profile"), support("demo-custom", "Annan fiktiv profil", undefined, "demo")];
    expect(personalSavedStrategies(saved).map(x => x.id)).toEqual(["normal"]);
    expect(saved).toHaveLength(3);
  });

  it("inserts an optional support as a draft line without saving or changing other lines", () => {
    expect(addStrategyToPlanningDraft("Handla\nVila", "Gör tiden synlig")).toBe("Handla\nVila\nGör tiden synlig");
    expect(addStrategyToPlanningDraft("", "Gör tiden synlig")).toBe("Gör tiden synlig");
    expect(strategyInPlanningDraft("Handla\nGör tiden synlig", "Gör tiden synlig")).toBe(true);
  });

  it("does not duplicate a strategy even when letter case differs", () => {
    expect(addStrategyToPlanningDraft("Handla\ngör tiden synlig", "Gör tiden synlig"))
      .toBe("Handla\ngör tiden synlig");
  });

  it("refuses malformed or overfull drafts without altering the user's text", () => {
    const fifty = Array.from({ length: 50 }, (_, i) => `Task ${i}`).join("\n");
    expect(addStrategyToPlanningDraft(fifty, "One more")).toBe(fifty);
    expect(addStrategyToPlanningDraft("Handla", "A\nB")).toBe("Handla");
    expect(addStrategyToPlanningDraft("Handla", " ")).toBe("Handla");
  });
});
