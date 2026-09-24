import { describe, expect, it } from "vitest";
import { dailyActivityVisual } from "@/lib/daily-activity-visual";
import type { FlowItem } from "@/lib/flow-items";

function item(title: string, area: FlowItem["area"] = "vardag", source: FlowItem["source"] = "uppgift"): FlowItem {
  return { id: title, title, area, source, emoji: "", priority: "idag" };
}

describe("Dagsvyns visuella aktivitetstolkning", () => {
  it("återanvänder Family Flows pictogram för vardagsaktiviteter", () => {
    expect(dailyActivityVisual(item("Göra frukost"))).toMatchObject({ pictogram: "breakfast", label: "Mat" });
    expect(dailyActivityVisual(item("Tvätta mina kläder"))).toMatchObject({ pictogram: "laundry", label: "Hemma" });
  });

  it("låter det sparade livsområdet styra etiketten", () => {
    expect(dailyActivityVisual(item("Plugga", "studier"))).toMatchObject({ pictogram: "study", label: "Studier", colorArea: "studier" });
    expect(dailyActivityVisual(item("Lämna på föris", "barn", "barn"))).toMatchObject({ label: "Familj · Barn", colorArea: "privat" });
  });

  it("ger okända aktiviteter ett neutralt pictogram", () => {
    expect(dailyActivityVisual(item("En helt egen sak"))).toMatchObject({ pictogram: "task", label: "Hem" });
  });
});