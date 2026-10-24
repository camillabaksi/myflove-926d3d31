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
  it("groups identical child activities, keeping presence when any copy requires it", () => {
    const entries = projectFamilyCalendar("2026-10-07", [child("bella"), child("bianca")], [item("a", "bella"), item("b", "bianca")], {}, "parent");
    const grouped = familyLayerEntries(entries, DEFAULT_FAMILY_LAYER);
    expect(grouped).toHaveLength(1); expect(grouped[0]?.label).toBe("bella & bianca");
    const withPresence = familyLayerEntries(entries, { ...DEFAULT_FAMILY_LAYER, presence: { "c-a": true } });
    expect(withPresence).toHaveLength(1);
    expect(withPresence[0]?.requiresParent).toBe(true);
    expect(withPresence[0]?.familyMembers).toHaveLength(2);
    expect(entries[0]?.familyMembers).toHaveLength(1);
  });
  it("shows the same activity at the same time once with both names, without touching sources", () => {
    const frukost = (id: string, childId: string) => ({ ...item(id, childId), title: "Frukost", time: "06:15", notes: encodeVisualNotes({ pictogram: "dinner", category: "hemma", tone: "mint" }) });
    const entries = projectFamilyCalendar("2026-10-26", [child("bella"), child("bianca")], [frukost("a", "bella"), frukost("b", "bianca")], {}, "parent");
    const grouped = familyLayerEntries(entries, DEFAULT_FAMILY_LAYER);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({ title: "Frukost", time: "06:15", label: "bella & bianca" });
    expect(grouped[0]?.memberTimes).toBeUndefined();
    expect(entries).toHaveLength(2);
  });
  it("groups the same activity at different times with explicit per-person times", () => {
    const vakna = (id: string, childId: string, time: string) => ({ ...item(id, childId), title: "Vakna", time, notes: encodeVisualNotes({ pictogram: "house", category: "hemma", tone: "mint" }) });
    const entries = projectFamilyCalendar("2026-10-26", [child("bella"), child("bianca")], [vakna("a", "bella", "05:00"), vakna("b", "bianca", "05:30")], {}, "parent");
    const grouped = familyLayerEntries(entries, DEFAULT_FAMILY_LAYER);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.time).toBe("05:00");
    expect(grouped[0]?.memberTimes).toEqual([
      { id: "bella", name: "bella", time: "05:00" },
      { id: "bianca", name: "bianca", time: "05:30" },
    ]);
  });
  it("never merges different locations, periods, or activities sharing a child", () => {
    const vakna = (id: string, childId: string, time: string) => ({ ...item(id, childId), title: "Vakna", time, notes: encodeVisualNotes({ pictogram: "house", category: "hemma", tone: "mint" }) });
    const base = projectFamilyCalendar("2026-10-26", [child("bella"), child("bianca")], [vakna("a", "bella", "05:00"), vakna("b", "bianca", "05:30")], {}, "parent");
    expect(familyLayerEntries(base.map((entry, i) => ({ ...entry, location: i ? "Mormor" : undefined })), DEFAULT_FAMILY_LAYER)).toHaveLength(2);
    const sameChild = projectFamilyCalendar("2026-10-26", [child("bella")], [vakna("a", "bella", "05:00"), vakna("b", "bella", "05:30")], {}, "parent");
    expect(familyLayerEntries(sameChild, DEFAULT_FAMILY_LAYER)).toHaveLength(2);
    const period = { ...item("p", "bella"), title: "Höstlov", time: null, date: "2026-10-26", repeat: "daily" as const, notes: encodeVisualNotes({ pictogram: "calendar", category: "familj", tone: "lavender", repeatUntil: "2026-10-30" }) };
    const periodEntries = projectFamilyCalendar("2026-10-27", [child("bella"), child("bianca")], [period, { ...period, id: "q", child_id: "bianca" }], {}, "parent");
    expect(familyLayerEntries(periodEntries, DEFAULT_FAMILY_LAYER)).toHaveLength(2);
  });
  it("hides an exact duplicate of the same child's occurrence without deleting it", () => {
    const entries = projectFamilyCalendar("2026-10-26", [child("bella")], [item("a", "bella"), item("b", "bella")], {}, "parent");
    const grouped = familyLayerEntries(entries, DEFAULT_FAMILY_LAYER);
    expect(grouped).toHaveLength(1);
    expect(entries).toHaveLength(2);
  });
  it("hides family, honors empty child selection and never hides own tasks about children", () => {
    const entries = projectFamilyCalendar("2026-10-07", [child("bella")], [item("a", "bella")], {}, "parent");
    const task = { ...own("Packa Bellas gympapåse", "07:00", "07:30"), area: "barn" };
    expect(familyLayerEntries([...entries, task], { ...DEFAULT_FAMILY_LAYER, mode: "mine" })).toEqual([task]);
    expect(familyLayerEntries(entries, { ...DEFAULT_FAMILY_LAYER, children: [] })).toEqual([]);
  });
  it("keeps different places apart and groups untimed rows only through an explicit link", () => {
    const entries = projectFamilyCalendar("2026-10-07", [child("bella"), child("bianca")], [item("a", "bella"), item("b", "bianca")], {}, "parent");
    const atPool = entries.map(entry => ({ ...entry, location: "Simhallen" }));
    expect(familyLayerEntries(atPool, DEFAULT_FAMILY_LAYER)).toHaveLength(1);
    expect(familyLayerEntries(atPool.map((entry, index) => ({ ...entry, location: index ? "Annan plats" : entry.location })), DEFAULT_FAMILY_LAYER)).toHaveLength(2);
    const untimed = atPool.map(entry => ({ ...entry, time: undefined, endTime: undefined }));
    expect(familyLayerEntries(untimed, DEFAULT_FAMILY_LAYER)).toHaveLength(2);
    expect(familyLayerEntries(untimed.map(entry => ({ ...entry, linkGroup: "shared-plan-row" })), DEFAULT_FAMILY_LAYER)).toHaveLength(1);
    expect(familyLayerEntries(atPool, { ...DEFAULT_FAMILY_LAYER, children: ["bianca"] })[0]?.label).toBe("bianca");
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
  it("retains the real start of an untimed child period without exposing notes or making it completable", () => {
    const activity = { ...item("holiday", "bella"), title: "Höstlov", date: "2026-10-20",
      time: null, repeat: "daily" as const,
      notes: encodeVisualNotes({ pictogram: "calendar", category: "familj", tone: "lavender", repeatUntil: "2026-10-30" }, "PRIVATE NOTE") };
    const projected = projectFamilyCalendar("2026-10-23", [child("bella")], [activity], {}, "parent");
    expect(projected).toEqual([expect.objectContaining({
      date: "2026-10-23", periodStart: "2026-10-20", periodEnd: "2026-10-30",
      done: false, editable: false, time: undefined,
    })]);
    expect(JSON.stringify(projected)).not.toContain("PRIVATE");
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
