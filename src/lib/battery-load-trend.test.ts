import { describe, expect, it } from "vitest";
import { buildBatteryLoadTrend } from "@/lib/battery-load-trend";
import type { ActivityInstance } from "@/lib/activity-history";

const instance = (date: string, status: ActivityInstance["status"]): ActivityInstance => ({
  key: `task-${date}`,
  sourceId: `task-${date}`,
  title: "Aktivitet",
  date,
  plannedDate: date,
  status,
  recurring: false,
});

describe("buildBatteryLoadTrend", () => {
  it("räknar bara genomförda belastningstillfällen", () => {
    const trend = buildBatteryLoadTrend({
      now: new Date("2026-09-11T12:00:00"),
      energy: [{ id: "e1", level: 3, logged_at: "2026-09-11T08:00:00" }],
      instances: [instance("2026-09-11", "genomford"), instance("2026-09-11", "planerad")],
    });
    expect(trend.loadOccasions).toBe(1);
    expect(trend.observedDays).toBe(1);
  });

  it("visar en fallande trend när den senare halvan är tydligt lägre", () => {
    const energy = [5, 5, 3, 2].map((level, index) => ({
      id: String(index),
      level,
      logged_at: `2026-09-${String(8 + index).padStart(2, "0")}T08:00:00`,
    }));
    const trend = buildBatteryLoadTrend({
      now: new Date("2026-09-11T12:00:00"),
      energy,
      instances: [],
    });
    expect(trend.direction).toBe("down");
    expect(trend.change).toBeLessThan(0);
  });

  it("räknar faktisk tid per dag från start- och sluttid", () => {
    const trend = buildBatteryLoadTrend({
      now: new Date("2026-09-11T12:00:00"),
      energy: [{ id: "e1", level: 3, logged_at: "2026-09-11T08:00:00" }],
      instances: [
        {
          ...instance("2026-09-11", "genomford"),
          startTime: "09:00",
          endTime: "10:30",
        },
        instance("2026-09-11", "genomford"), // inga tider → uppskattat 30 min
        instance("2026-09-11", "planerad"), // räknas inte
      ],
    });
    const day = trend.days.find((d) => d.day === "2026-09-11");
    expect(day?.loadMinutes).toBe(120);
    expect(day?.loadCount).toBe(2);
    expect(trend.periods.weeks.find((p) => p.key === "2026-09-07")?.loadMinutes).toBe(120);
  });

  it("visar ett tidsbaserat samband när längre dagar ger lägre batteri", () => {
    const days = ["2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08"];
    const energy = [5, 5, 3, 2, 2].map((level, index) => ({
      id: String(index),
      level,
      logged_at: `${days[index]}T08:00:00`,
    }));
    const minutesPerDay = [60, 60, 240, 300, 300];
    const instances = days.flatMap((date, index) =>
      Array.from({ length: index + 1 }, (_, i) => ({
        ...instance(date, "genomford"),
        key: `t-${date}-${i}`,
        sourceId: `t-${date}-${i}`,
        startTime: "09:00",
        endTime: `09:${String(minutesPerDay[index] / (index + 1)).padStart(2, "0")}`.replace(
          /09:(\d+)/,
          (_, m) => {
            const total = 9 * 60 + Math.round(minutesPerDay[index] / (index + 1));
            return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
          },
        ),
      })),
    );
    const trend = buildBatteryLoadTrend({
      now: new Date("2026-09-11T12:00:00"),
      energy,
      instances,
    });
    expect(trend.timeEffect).not.toBeNull();
    expect(trend.timeEffect!).toBeLessThan(0);
  });

  it("sammanställer belastning per dag, vecka och månad", () => {
    const trend = buildBatteryLoadTrend({
      now: new Date("2026-09-11T12:00:00"),
      energy: [
        { id: "a", level: 4, logged_at: "2026-08-31T08:00:00" },
        { id: "b", level: 2, logged_at: "2026-09-01T08:00:00" },
      ],
      instances: [
        instance("2026-08-31", "genomford"),
        instance("2026-09-01", "genomford"),
        instance("2026-09-01", "genomford"),
      ],
    });

    expect(trend.periods.days).toHaveLength(28);
    expect(trend.periods.weeks.find((period) => period.key === "2026-08-31")?.loadCount).toBe(3);
    expect(trend.periods.months.find((period) => period.key === "2026-08")?.loadCount).toBe(1);
    expect(trend.periods.months.find((period) => period.key === "2026-09")?.loadCount).toBe(2);
  });
});
