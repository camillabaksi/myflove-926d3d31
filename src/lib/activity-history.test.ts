import { describe, expect, it } from "vitest";
import {
  completeInstance,
  expandInstances,
  groupByDay,
  moveInstance,
  recordEnergy,
  type ActivitySource,
  type InstanceRecord,
} from "@/lib/activity-history";

const forskola: ActivitySource = {
  id: "s1",
  title: "Förskola",
  plannedDate: "2026-09-07", // måndag
  startTime: "08:00",
  repeat: "weekdays",
};

const fotboll: ActivitySource = {
  id: "s2",
  title: "Fotbollsträning",
  plannedDate: "2026-09-10", // torsdag
  startTime: "17:00",
};

describe("expandInstances", () => {
  it("visar en engångsaktivitet bara på sitt planerade datum", () => {
    const week = expandInstances([fotboll], [], "2026-09-07", "2026-09-13");
    expect(week.map((i) => i.date)).toEqual(["2026-09-10"]);
  });

  it("ger varje förekomst av en återkommande aktivitet en egen instans", () => {
    const week = expandInstances([forskola], [], "2026-09-07", "2026-09-13");
    expect(week).toHaveLength(5);
    expect(week.every((i) => i.status === "planerad")).toBe(true);
    expect(new Set(week.map((i) => i.key)).size).toBe(5);
  });

  it("markerar bara den dag som faktiskt genomfördes", () => {
    let records: InstanceRecord[] = [];
    records = completeInstance(records, "s1", "2026-09-07", Date.parse("2026-09-07T09:00:00"));
    const week = expandInstances([forskola], records, "2026-09-07", "2026-09-13");
    const done = week.filter((i) => i.status === "genomford");
    expect(done.map((i) => i.date)).toEqual(["2026-09-07"]);
  });

  it("flyttar en aktivitet utan att lämna kvar den gamla dagen", () => {
    const records = moveInstance([], "s2", "2026-09-10", "2026-09-11");
    const week = expandInstances([fotboll], records, "2026-09-07", "2026-09-13");
    expect(week.map((i) => i.date)).toEqual(["2026-09-11"]);
    expect(week[0]!.plannedDate).toBe("2026-09-10");
    expect(week[0]!.status).toBe("planerad");
  });

  it("sparar energipåverkan per förekomst", () => {
    let records = completeInstance([], "s1", "2026-09-08");
    records = recordEnergy(records, "s1", "2026-09-08", "drains_much");
    const week = expandInstances([forskola], records, "2026-09-07", "2026-09-13");
    const tuesday = week.find((i) => i.date === "2026-09-08");
    const monday = week.find((i) => i.date === "2026-09-07");
    expect(tuesday?.energyImpact).toBe("drains_much");
    expect(monday?.energyImpact).toBeUndefined();
  });

  it("visar en engångsaktivitet som genomförd på sin planerade dag även om avbockningen skedde senare", () => {
    const done: ActivitySource = {
      ...fotboll,
      completed: true,
      completedAt: Date.parse("2026-09-12T20:00:00"),
    };
    const week = expandInstances([done], [], "2026-09-07", "2026-09-13");
    expect(week.map((i) => i.date)).toEqual(["2026-09-10"]);
    expect(week[0]!.status).toBe("genomford");
    expect(week[0]!.actualDate).toBe("2026-09-12");
  });
});

describe("groupByDay", () => {
  it("grupperar per dag med nyaste först", () => {
    const week = expandInstances([forskola, fotboll], [], "2026-09-07", "2026-09-13");
    const days = groupByDay(week);
    expect(days[0]!.date).toBe("2026-09-11");
    expect(days.at(-1)!.date).toBe("2026-09-07");
    expect(days.find((d) => d.date === "2026-09-10")!.items).toHaveLength(2);
  });
});
