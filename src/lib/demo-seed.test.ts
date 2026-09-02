import { describe, expect, it } from "vitest";
import { DEMO_EMAIL, isDemoUser } from "@/lib/demo-account";
import { buildDemoSeed } from "@/lib/demo-seed-data";

describe("investor demo account", () => {
  it("recognises only the marked demo identity", () => {
    expect(isDemoUser({ email: DEMO_EMAIL })).toBe(true);
    expect(isDemoUser({ email: "other@example.com" })).toBe(false);
    expect(isDemoUser({ user_metadata: { demo_account: true } })).toBe(true);
  });

  it("seeds the requested mental inbox and daily agenda", () => {
    const seed = buildDemoSeed(new Date("2026-09-02T07:00:00.000Z"));
    const quickflow = seed.kv["myflove-quickflow"] as Array<{ text: string }>;
    const tasks = seed.kv["myflow-tasks"] as Array<{ title: string; time?: string }>;
    const plan = seed.kv["myflove-day-plan"] as { intro: string };

    expect(quickflow.map((item) => item.text)).toEqual([
      "Svara på viktigt mejl",
      "Boka tandläkartid",
      "Förbereda presentation",
      "Köpa födelsedagspresent",
      "Ring försäkringsbolaget",
    ]);
    expect(tasks.map((task) => `${task.time} ${task.title}`)).toEqual([
      "08:00 Frukost",
      "09:00 Svara på viktigt mejl",
      "10:30 Möte",
      "12:00 Lunch",
      "14:00 Förbereda presentation",
      "17:00 Hämta barn",
    ]);
    expect(plan.intro).toContain("ganska mycket på gång idag");
  });

  it("keeps demo health observations synthetic and historical", () => {
    const seed = buildDemoSeed(new Date("2026-09-02T07:00:00.000Z"));
    const energy = seed.energy;
    expect(energy).toHaveLength(9);
    expect(new Set(energy.map((entry) => entry.logged_at)).size).toBe(9);
    expect(energy.every((entry) => entry.note === "Exempeldata (demo)")).toBe(true);
    expect(energy.some((entry) => entry.level === 3)).toBe(true);
  });
});
