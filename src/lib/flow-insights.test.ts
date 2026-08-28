import { describe, it, expect } from "vitest";
import { generateFlowInsights } from "@/lib/flow-insights";
import type { MoodEntry, Task } from "@/hooks/use-data";
import { todayISO } from "@/lib/day";

const day = 24 * 60 * 60 * 1000;

const mood = (score: number, at: number): MoodEntry => ({
  id: Math.random().toString(36).slice(2),
  score,
  date: at,
});

const task = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36).slice(2),
  title: "Uppgift",
  completed: false,
  createdAt: Date.now(),
  ...over,
});

describe("generateFlowInsights – äkta insikter", () => {
  it("säger inget alls utan underlag", () => {
    expect(generateFlowInsights([], [], null)).toEqual([]);
  });

  it("gör inget mönster av en enstaka måendelogg", () => {
    const res = generateFlowInsights([mood(5, Date.now())], [], null);
    expect(res).toEqual([]);
  });

  it("rapporterar måendetrend först vid minst tre loggar", () => {
    const now = Date.now();
    const res = generateFlowInsights(
      [mood(4, now), mood(4, now - day), mood(5, now - 2 * day)],
      [],
      null,
    );
    expect(res.some((i) => i.text.includes("ljusare sidan"))).toBe(true);
    expect(res.every((i) => i.basis.length > 0)).toBe(true);
  });

  it("räknar avklarade uppgifter på completedAt, inte createdAt", () => {
    const old = Date.now() - 40 * day;
    const res = generateFlowInsights(
      [],
      [task({ completed: true, createdAt: old, completedAt: Date.now() - day })],
      null,
    );
    expect(res.some((i) => i.text.includes("1 uppgift"))).toBe(true);

    const stale = generateFlowInsights(
      [],
      [task({ completed: true, createdAt: Date.now(), completedAt: old })],
      null,
    );
    expect(stale).toEqual([]);
  });

  it("visar dagens fokus bara när det gäller idag", () => {
    const today = generateFlowInsights([], [], {
      text: "Ringa vården",
      completed: true,
      date: todayISO(),
    });
    expect(today.some((i) => i.text.includes("Ringa vården"))).toBe(true);

    const yesterday = generateFlowInsights([], [], {
      text: "Ringa vården",
      completed: true,
      date: "2020-01-01",
    });
    expect(yesterday).toEqual([]);
  });
});
