import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { activityWord, draftOverridesRoute, nowCandidateIds, planningPeriodForDate } from "./calendar-day-summary";
import { MORE_ALL_HREFS, MORE_OVERALL } from "@/components/paceable/more-view";

describe("Kalender > Min dag: perioder och Just nu", () => {
  it("never repeats the same ongoing period under Just nu", () => {
    const ids = nowCandidateIds([{ id: "r-kurs", periodEnd: "2026-12-18" }]);
    expect(ids.has("r-kurs")).toBe(false);
  });
  it("keeps a separate timed activity eligible for Just nu", () => {
    const ids = nowCandidateIds([{ id: "r-kurs", periodEnd: "2026-12-18" }, { id: "t-mote" }]);
    expect([...ids]).toEqual(["t-mote"]);
  });
  it("uses singular for exactly one activity", () => {
    expect(activityWord(1)).toBe("aktivitet");
    expect(activityWord(0)).toBe("aktiviteter");
    expect(activityWord(2)).toBe("aktiviteter");
  });
});

describe("Valt kalenderdatum → Planera", () => {
  const today = "2026-10-23", tomorrow = "2026-10-24";
  it("maps today, tomorrow and other chosen days (week/month) to a period", () => {
    expect(planningPeriodForDate(today, today, tomorrow)).toBe("today");
    expect(planningPeriodForDate(tomorrow, today, tomorrow)).toBe("tomorrow");
    expect(planningPeriodForDate("2026-10-28", today, tomorrow)).toBe("week");
  });
  it("lets an empty earlier draft never replace the date chosen in Calendar", () => {
    expect(draftOverridesRoute({ text: "", rows: [] }, "week")).toBe(false);
    expect(draftOverridesRoute({ text: "  ", rows: [] }, "today")).toBe(false);
  });
  it("keeps a draft with typed text so it is never silently redated", () => {
    expect(draftOverridesRoute({ text: "Handla", rows: [] }, "week")).toBe(true);
    expect(draftOverridesRoute({ text: "", rows: [{}] }, "today")).toBe(true);
  });
  it("calendar sends date, view and return hint to every Planera link", () => {
    const src = readFileSync("src/components/calendar/calendar-planner.tsx", "utf8");
    const links = src.match(/<PlanningLink to="\/planera" search=\{\{[^}]*\}\}/g) ?? [];
    const withDate = links.filter((l) => l.includes("date,") || l.includes("date:"));
    expect(withDate.length).toBeGreaterThanOrEqual(3);
    for (const link of withDate.filter((l) => !l.includes("editDate"))) expect(link).toContain('from: "kalender", view');
    expect(src).toContain('url.searchParams.set("date", date)');
  });
});

describe("Historik-ingång", () => {
  it("has exactly one Historik link in Mer under Insikter & historik", () => {
    expect(MORE_ALL_HREFS.filter((h) => h === "/historik")).toHaveLength(1);
    expect(MORE_OVERALL.find((g) => g.title === "Insikter & historik")?.hrefs).toContain("/historik");
  });
  it("stays visible in simple mode (marked essential)", () => {
    const src = readFileSync("src/components/layout.tsx", "utf8");
    expect(src).toMatch(/href: "\/historik",\s*label: "Historik",[^}]*essential: true/);
  });
});
