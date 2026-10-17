import { describe, expect, it } from "vitest";
import {
  appendPlanningTasks,
  childPlanningRows,
  draftPlanningLines,
  planningTasks,
  validatePlanningDrafts,
} from "./planning";
import { decodeVisualNotes } from "./child-visual-schedule";

const date = "2026-10-17";
describe("Reviewed planning batches", () => {
  it("keeps rows and chosen dates when inserting lines, including two equal activity names", () => {
    const prior = draftPlanningLines("Handla\nHandla", date, []);
    prior[0]!.date = "2026-10-18";
    const next = draftPlanningLines("Ny aktivitet\nHandla\nHandla", date, [], prior);
    expect(next.slice(1).map((row) => row.id)).toEqual(prior.map((row) => row.id));
    expect(next[1]!.date).toBe("2026-10-18");
    expect(new Set(next.map((row) => row.id)).size).toBe(3);
  });
  it("validates the whole batch before building records and never invents times or energy", () => {
    const rows = draftPlanningLines("Tvätta\nPromenad", date, []);
    expect(
      planningTasks(rows).every(
        (task) => task.time === undefined && task.energyImpact === "unknown",
      ),
    ).toBe(true);
    rows[1]!.date = "2026-02-30";
    expect(() => planningTasks(rows)).toThrow();
    rows[1]!.date = date;
    rows[1]!.time = "18:00";
    rows[1]!.endTime = "17:00";
    expect(() => validatePlanningDrafts(rows)).toThrow(/Sluttiden/);
    expect(() => draftPlanningLines(Array(51).fill("x").join("\n"), date, [])).toThrow();
  });
  it("appends personal tasks once and preserves a concurrently added task", () => {
    const rows = planningTasks(draftPlanningLines("Tvätta\nPromenad", date, []));
    const other = { ...rows[0]!, id: "concurrent", title: "Annat" };
    const once = appendPlanningTasks([other], rows);
    expect(appendPlanningTasks(once, rows)).toEqual(once);
    expect(once).toContain(other);
    expect(() => appendPlanningTasks([{ ...rows[0]!, title: "Ändrad" }], rows)).toThrow(/ändrats/);
  });
  it("creates independent private child rows with a shared link and stable retry IDs", () => {
    const drafts = draftPlanningLines("Simskola\nFrukost", date, ["bella", "bianca"]);
    drafts[0]!.time = "15:00";
    drafts[0]!.endTime = "16:00";
    drafts[0]!.location = "Simhallen [bassäng 2]";
    drafts[1]!.childIds = ["bella"];
    const rows = childPlanningRows(drafts, "owner", ["bella", "bianca"]);
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.id)).size).toBe(3);
    expect(
      rows.every(
        (row) => row.owner_id === "owner" && row.share_family === false && row.completed === false,
      ),
    ).toBe(true);
    expect(rows.map((row) => row.child_id)).toEqual(["bella", "bianca", "bella"]);
    expect(rows.slice(0, 2).map((row) => decodeVisualNotes(row.notes).meta)).toEqual(
      Array(2).fill(
        expect.objectContaining({
          linkGroup: drafts[0]!.id,
          location: "Simhallen [bassäng 2]",
          endTime: "16:00",
        }),
      ),
    );
    expect(childPlanningRows(drafts, "owner", ["bella", "bianca"])).toEqual(rows);
  });
  it("never interprets zero recipients as everyone and rejects children owned elsewhere", () => {
    const rows = draftPlanningLines("Frukost", date, []);
    expect(() => childPlanningRows(rows, "owner", ["bella"])).toThrow();
    const foreign = draftPlanningLines("Frukost", date, ["other-child"]);
    expect(() => childPlanningRows(foreign, "owner", ["bella"])).toThrow();
  });
});
