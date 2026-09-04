import { describe, expect, it } from "vitest";
import { buildWeekReview, weekStartISO, type WeekReviewInput } from "@/lib/week-review";
import type { ActivityInstance } from "@/lib/activity-history";

function inst(
  date: string,
  title: string,
  extra: Partial<ActivityInstance> = {},
): ActivityInstance {
  return {
    key: `${title}|${date}`,
    sourceId: title,
    title,
    date,
    plannedDate: date,
    status: "genomford",
    recurring: false,
    ...extra,
  };
}

const WEEK = "2026-09-07"; // måndag

function base(overrides: Partial<WeekReviewInput> = {}): WeekReviewInput {
  return {
    weekStart: WEEK,
    instances: [],
    energy: [],
    moods: [],
    quickflowDone: [],
    ...overrides,
  };
}

describe("weekStartISO", () => {
  it("hittar måndagen, även på söndag", () => {
    expect(weekStartISO("2026-09-13")).toBe("2026-09-07");
    expect(weekStartISO("2026-09-07")).toBe("2026-09-07");
  });
});

describe("buildWeekReview", () => {
  it("säger att vi fortfarande lär oss när underlaget saknas", () => {
    const review = buildWeekReview(base());
    expect(review.enoughData).toBe(false);
    expect(review.summary).toContain("Vi lär fortfarande känna din vardag");
    expect(review.observations).toEqual([]);
    expect(review.suggestions).toEqual([]);
  });

  it("räknar bara veckans egna aktiviteter", () => {
    const review = buildWeekReview(
      base({
        instances: [inst("2026-09-08", "Handla"), inst("2026-09-20", "Utanför veckan")],
      }),
    );
    expect(review.activityCount).toBe(1);
  });

  it("summerar energipåverkan per svar", () => {
    const review = buildWeekReview(
      base({
        instances: [
          inst("2026-09-08", "Promenad", { energyImpact: "gives" }),
          inst("2026-09-09", "Handla mat", { energyImpact: "drains_much" }),
          inst("2026-09-09", "Tvätt", { energyImpact: "drains_little" }),
          inst("2026-09-10", "Möte", { energyImpact: "neutral" }),
        ],
      }),
    );
    expect(review.impact).toEqual({ gives: 1, neutral: 1, drains_little: 1, drains_much: 1 });
  });

  it("pekar ut lättare och tyngre dagar när ork loggats flera dagar", () => {
    const review = buildWeekReview(
      base({
        energy: [
          { level: 5, loggedAt: "2026-09-08T09:00:00" },
          { level: 5, loggedAt: "2026-09-09T09:00:00" },
          { level: 2, loggedAt: "2026-09-10T09:00:00" },
          { level: 2, loggedAt: "2026-09-11T09:00:00" },
        ],
      }),
    );
    expect(review.energyLabel).toBe("varierat");
    expect(review.observations[0]).toContain("tisdag");
    expect(review.observations[0]).toContain("torsdag");
  });

  it("hittar inte på mönster utan underlag", () => {
    const review = buildWeekReview(
      base({
        instances: [inst("2026-09-08", "Handla mat", { energyImpact: "drains_much" })],
        energy: [{ level: 3, loggedAt: "2026-09-08T09:00:00" }],
        moods: [{ score: 3, date: Date.parse("2026-09-08T09:00:00") }],
      }),
    );
    expect(review.enoughData).toBe(true);
    expect(review.observations).toEqual([]);
  });

  it("ger ett mjukt förslag för den tyngsta dagen", () => {
    const review = buildWeekReview(
      base({
        instances: [
          inst("2026-09-10", "A"),
          inst("2026-09-10", "B"),
          inst("2026-09-10", "C"),
          inst("2026-09-10", "D"),
          inst("2026-09-08", "E"),
        ],
      }),
    );
    expect(review.suggestions[0]).toContain("torsdagar");
    expect(review.suggestions[0]).toContain("Vill du");
  });

  it("kopplar kategori till energi först vid tillräckligt många svar", () => {
    const review = buildWeekReview(
      base({
        instances: [
          inst("2026-09-08", "Promenad i skogen", { energyImpact: "gives" }),
          inst("2026-09-09", "Promenad ute", { energyImpact: "gives" }),
          inst("2026-09-10", "Cykel till jobbet", { energyImpact: "gives" }),
        ],
      }),
    );
    expect(review.observations.some((o) => o.includes("utomhus"))).toBe(true);
  });
});
