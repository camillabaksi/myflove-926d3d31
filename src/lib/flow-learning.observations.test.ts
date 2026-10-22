import { describe, expect, it } from "vitest";
import { analyzeFlow, type FlowLearningInput } from "./flow-learning";

const base = (): FlowLearningInput => ({
  completed: [], open: [], energy: [], activeDays: 10, people: 0,
});

describe("Insikter describe observations rather than promising automatic planning", () => {
  it("does not claim the calendar was adjusted just because tasks happened late", () => {
    const data = base();
    data.completed = Array.from({ length: 7 }, (_, i) => ({
      title: `Uppgift ${i}`, completedAt: new Date(2026, 9, 10 + i, 20, 0).getTime(),
    }));
    const observed = analyzeFlow(data).insights.find(i => i.id === "evenings");
    expect(observed?.text).toContain("Du kan själv välja");
    expect(observed?.text).not.toContain("Jag lägger");
  });

  it("does not claim that planned-open tasks prove someone's day was demanding", () => {
    const data = base();
    data.open = Array.from({ length: 4 }, (_, i) => ({
      createdAt: Date.now(), dueDate: `2026-10-${String(19+i*7).padStart(2, "0")}`, title: "Plan",
    }));
    const observed = analyzeFlow(data).insights.find(i => i.id === "heavy-day");
    if (observed) {
      expect(observed.text).toContain("öppna uppgifter planerade");
      expect(observed.text).not.toContain("du brukar behöva");
    }
  });

  it("suggests considering time to recover, never implies automatic change to the user's plan", () => {
    const data = base();
    data.energy = [
      ...Array.from({ length: 4 }, (_, i) => ({ level: 20, at: new Date(2026, 9, 10+i, 16, 0).getTime() })),
      { level: 75, at: new Date(2026, 9, 12, 9, 0).getTime() },
    ];
    const observed = analyzeFlow(data).insights.find(i => i.id === "energy-dip");
    expect(observed?.text).toContain("Du har registrerat låg energi");
    expect(observed?.text).not.toMatch(/jag lägger|jag ändrar/i);
  });
});
