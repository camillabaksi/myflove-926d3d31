import { describe, expect, it } from "vitest";
import { DEFAULT_FAMILY_LAYER, familyLayerEntries, familyPlanningContext, projectFamilyCalendar } from "./family-calendar";
import { calendarGaps, calendarLoad, type CalendarEntry } from "./visual-calendar";
import { encodeVisualNotes, pickNowNext } from "./child-visual-schedule";
import type { Child, ChildItem } from "@/hooks/use-children";

const child = (id: string): Child => ({ id, name: id, owner_id: "parent", birthdate: null, note: "private profile", helps: ["private"], color: "", avatar: null, account_user_id: "separate-account" });
const item = (id: string, childId: string, parentPresence = false): ChildItem => ({ id, child_id: childId, owner_id: "parent", kind: "activity", title: "Skola", time: "08:00", date: "2026-10-07", completed: true, remind: false, repeat: "none", file_path: "private-document", created_at: "", updated_at: "", sharedWith: [], shareNotify: {}, notes: encodeVisualNotes({ pictogram: "school", category: "skola", tone: "sky", endTime: "14:00", parentPresence }, "PRIVATE NOTE") });
const own = (id: string, time: string, endTime: string): CalendarEntry => ({ id, sourceId: id, source: "task", date: "2026-10-07", title: id, time, endTime, done: false, editable: true });
describe("family calendar layer", () => {
  it("projects existing authorized rows without private fields, completion, or account links", () => {
    const original = item("a", "bella");
    const projected = projectFamilyCalendar("2026-10-07", [child("bella")], [original], {}, "parent");
    expect(projected[0]).toMatchObject({ done: false, editable: false, requiresParent: false, endTime: "14:00" });
    expect(JSON.stringify(projected)).not.toMatch(/PRIVATE|private|separate-account|file_path|account_user_id/);
    expect(original.completed).toBe(true);
  });
  it("requires explicit presence and never assumes another parent's presence is mine", () => {
    const projected = projectFamilyCalendar("2026-10-07", [child("bella")], [item("a", "bella", true)], {}, "other-parent");
    expect(projected[0]?.requiresParent).toBe(false);
  });
  it("groups identical child activities, but never different responsibilities", () => {
    const entries = projectFamilyCalendar("2026-10-07", [child("bella"), child("bianca")], [item("a", "bella"), item("b", "bianca")], {}, "parent");
    const grouped = familyLayerEntries(entries, DEFAULT_FAMILY_LAYER);
    expect(grouped).toHaveLength(1); expect(grouped[0]?.label).toBe("bella & bianca");
    expect(familyLayerEntries(entries, { ...DEFAULT_FAMILY_LAYER, presence: { "c-a": true } })).toHaveLength(2);
    expect(entries[0]?.familyMembers).toHaveLength(1);
  });
  it("hides family, honors empty child selection and never hides own tasks about children", () => {
    const entries = projectFamilyCalendar("2026-10-07", [child("bella")], [item("a", "bella")], {}, "parent");
    const task = { ...own("Packa Bellas gympapåse", "07:00", "07:30"), area: "barn" };
    expect(familyLayerEntries([...entries, task], { ...DEFAULT_FAMILY_LAYER, mode: "mine" })).toEqual([task]);
    expect(familyLayerEntries(entries, { ...DEFAULT_FAMILY_LAYER, children: [] })).toEqual([]);
  });
  it("context neither consumes parental load nor removes free time; explicit presence does", () => {
    const [school] = projectFamilyCalendar("2026-10-07", [child("bella")], [item("a", "bella")], {}, "parent");
    if (!school) throw Error("Missing fixture");
    const ownEntries = [own("A", "09:00", "10:00"), own("B", "11:00", "12:00")];
    expect(calendarGaps([...ownEntries, school])).toEqual(calendarGaps(ownEntries));
    expect(calendarLoad([school]).unknown).toBe(0);
    expect(calendarLoad([{ ...school, requiresParent: true }]).label).toBe("Inte uppskattad");
    expect(familyPlanningContext([school], "10:00", "11:00").presence).toHaveLength(0);
    expect(familyPlanningContext([{ ...school, requiresParent: true }], "10:00", "11:00").presence).toHaveLength(1);
  });
  it("uses school schedules only for the owning account", () => {
    const schedules = { bella: [{ id: "school", weekday: 2, start: "08:00", end: "14:00", title: "Skola", teacher: "private teacher" }] };
    expect(projectFamilyCalendar("2026-10-07", [child("bella")], [], schedules, "other")).toEqual([]);
    expect(JSON.stringify(projectFamilyCalendar("2026-10-07", [child("bella")], [], schedules, "parent"))).not.toContain("teacher");
  });
  it("includes repeated activities until their registered end date, without expanding history", () => {
    const activity = { ...item("a", "bella"), repeat: "weekdays" as const, notes: encodeVisualNotes({ pictogram: "school", category: "skola", tone: "sky", repeatUntil: "2026-10-09" }) };
    expect(projectFamilyCalendar("2026-10-08", [child("bella")], [activity], {}, "parent")).toHaveLength(1);
    expect(projectFamilyCalendar("2026-10-12", [child("bella")], [activity], {}, "parent")).toHaveLength(0);
  });
  it("honors registered travel/preparation without inventing missing durations", () => {
    const context = { ...own("pickup", "16:30", "17:00"), source: "child" as const, requiresParent: true, prepMinutes: 10, travelMinutes: 15 };
    expect(familyPlanningContext([context], "16:00", "16:15").presence).toHaveLength(1);
    expect(familyPlanningContext([{ ...context, endTime: undefined }], "17:30", "18:00").presence).toHaveLength(0);
  });
  it("advances by time even when activities were marked complete and separates untimed items", () => {
    const school = { time: "08:00", completed: true, notes: encodeVisualNotes({ pictogram: "school", category: "skola", tone: "sky", endTime: "14:00" }) };
    const sport = { time: "14:00", completed: false, notes: encodeVisualNotes({ pictogram: "exercise", category: "träning", tone: "mint", endTime: "15:00" }) };
    const untimed = { time: null, notes: null };
    expect(pickNowNext([sport, untimed, school], 630)).toEqual({ current: school, next: sport });
    expect(pickNowNext([school, sport], 840)).toEqual({ current: sport, next: null });
    expect(pickNowNext([school, sport, untimed], 901)).toEqual({ current: null, next: null });
    expect(pickNowNext([school, sport], 450)).toEqual({ current: null, next: school });
  });
});