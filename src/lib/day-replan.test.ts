import { describe, expect, it } from "vitest";
import type { Task } from "@/hooks/use-data";
import { applyDayReplanChanges, buildDayReplan, deferrableReplanTasks, type ReplanInput } from "./day-replan";
import type { CalendarEntry } from "./visual-calendar";

const date = "2026-10-15";
const task = (id = "shop", patch: Partial<Task> = {}): Task => ({ id, title: "Handla", time: "14:00", endTime: "14:45", dueDate: date, completed: false, createdAt: 1, note: "Behåll anteckningen", attachments: [{ name: "fil.pdf", path: "private/path", uploadedAt: 1 }], ...patch });
const own = (value: Task): CalendarEntry => ({ id: `task-${value.id}`, sourceId: value.id, source: "task", date, title: value.title, time: value.time, endTime: value.endTime, done: value.completed, editable: true });
const fixed = (id: string, time: string, endTime?: string): CalendarEntry => ({ id, sourceId: id, source: "external", date, title: id, time, endTime, done: false, editable: false });
const input = (tasks = [task()]): ReplanInput => ({ tasks, entries: [...tasks.map(own), fixed("Studier", "13:00", "14:00"), fixed("Hämtning", "14:30", "15:00"), fixed("Bokat", "16:30", "17:00")], date, nowMinutes: 13 * 60, capacity: null, useCapacity: true, deferIds: [], calendarReady: true });

describe("Reviewed day replanning", () => {
  it("resolves a collision inside a verified gap without using a capacity estimate", () => {
    const data = input();
    const result = buildDayReplan(data);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({ taskId: "shop", kind: "time", before: "14:00–14:45", after: "15:15–16:00", patch: { time: "15:15", endTime: "16:00" } });
    expect(data.tasks[0].time).toBe("14:00");
    expect(data.entries[2].time).toBe("14:30");
  });
  it("does not invent lengths, slots after an unknown end, or times from incomplete calendar reads", () => {
    const unknownTask = input([task("shop", { endTime: undefined })]);
    expect(buildDayReplan(unknownTask).changes).toEqual([]);
    expect(buildDayReplan(unknownTask).unknownDurations).toBe(1);
    const unknownBooking = input(); unknownBooking.entries[2].endTime = undefined;
    expect(buildDayReplan(unknownBooking).changes).toEqual([]);
    const loading = input(); loading.calendarReady = false;
    expect(buildDayReplan(loading).changes).toEqual([]);
  });
  it("uses a real zero capacity for small-step suggestions, supports opt-out, and never adds work at high capacity", () => {
    const data = input([task("heavy", { title: "Städa hemmet", time: undefined, endTime: undefined, friction: "large" })]);
    expect(buildDayReplan({ ...data, capacity: 0 }).changes[0]).toMatchObject({ kind: "small-step", patch: { steps: [expect.objectContaining({ done: false })] } });
    expect(buildDayReplan({ ...data, capacity: 0, useCapacity: false }).changes).toEqual([]);
    expect(buildDayReplan({ ...data, capacity: null }).changes).toEqual([]);
    expect(buildDayReplan({ ...data, capacity: 100 }).changes).toEqual([]);
    expect(data.tasks[0].steps).toBeUndefined();
  });
  it("only proposes tomorrow after an explicit choice and removes its time rather than predicting tomorrow", () => {
    const data = input([task("laundry", { title: "Tvätta", time: "19:00", endTime: "19:45" })]);
    expect(buildDayReplan(data).changes).toEqual([]);
    const result = buildDayReplan({ ...data, deferIds: ["laundry"] });
    expect(result.changes[0]).toMatchObject({ kind: "tomorrow", after: "Imorgon · utan tid" });
    const updated = applyDayReplanChanges(data.tasks, data.tasks, result.changes, date);
    expect(updated[0]).toMatchObject({ dueDate: "2026-10-16", note: "Behåll anteckningen", attachments: data.tasks[0].attachments });
    expect(updated[0].time).toBeUndefined(); expect(updated[0].endTime).toBeUndefined();
  });
  it("protects health, care, bookings, reminders, deadlines, generated/linked and completed records", () => {
    const protectedTasks = [
      task("health", { title: "Ta medicin" }), task("care", { title: "Hämta barnen" }), task("meeting", { title: "Bokat möte" }),
      task("rem", { reminderMinutesBefore: 0 }), task("deadline", { deadlineLeadDays: [1] }),
      task("generated", { syncKey: "studyflow:lecture:abc" }), task("linked", { quickflowId: "qf" }),
      task("done", { completed: true }), task("future", { dueDate: "2026-10-16" }), task("waiting", { status: "vantar" }),
    ];
    expect(buildDayReplan({ ...input(protectedTasks), capacity: 0, deferIds: protectedTasks.map(t => t.id) }).changes).toEqual([]);
    const parent = input(); parent.entries.push({ ...fixed("child", "14:30", "15:00"), source: "child", parentTaskId: "shop", requiresParent: true });
    expect(buildDayReplan(parent).changes).toEqual([]);
  });
  it("respects child context vs explicit parent presence and its recorded travel time", () => {
    const data = input(); data.entries[2] = { ...data.entries[2], source: "child", requiresParent: false };
    expect(buildDayReplan(data).changes).toEqual([]); // child context causes no collision
    data.entries[2].requiresParent = true;
    data.entries[2].travelMinutes = 10;
    expect(buildDayReplan(data).changes[0]?.after).toBe("15:15–16:00");
  });
  it("does not postpone prerequisites of another task or move the start after its dependent booking", () => {
    const data = input([task("wash", { title: "Tvätta", time: undefined, endTime: undefined }), task("hang", { title: "Häng tvätten", time: undefined, endTime: undefined })]);
    expect(deferrableReplanTasks(data).map(task => task.id)).not.toContain("wash");
    const shopping = input(); shopping.entries[3] = { ...shopping.entries[3], title: "Laga middag", time: "15:30", endTime: "16:30" };
    expect(buildDayReplan(shopping).changes).toEqual([]);
  });
  it("keeps recorded child travel/preparation reserved even when an owned parent task replaces its load", () => {
    const shopping = task("shop", { time: "13:30", endTime: "14:30" });
    const parent = task("parent", { title: "Hämta barnen", time: "14:30", endTime: "15:00" });
    const data = input([shopping, parent]);
    data.entries = [own(shopping), own(parent), fixed("Studier", "12:00", "13:00"), fixed("Bokat", "16:30", "17:00"),
      { ...fixed("child", "14:30", "15:00"), source: "child", requiresParent: true, parentTaskId: "parent", prepMinutes: 20, travelMinutes: 15 }];
    expect(buildDayReplan(data).changes[0]?.after).toBe("15:15–16:15");
    expect(buildDayReplan(data).changes.some(change => change.taskId === "parent")).toBe(false);
  });
  it("keeps proposed destinations separate and permits selecting any subset", () => {
    const data = input([task("a"), task("b", { title: "Köpa mat", time: "14:10", endTime: "14:40" })]);
    data.entries[data.entries.length - 1] = fixed("Bokat", "18:30", "19:00");
    const changes = buildDayReplan(data).changes;
    expect(changes).toHaveLength(2);
    expect(changes[0].patch.endTime! < changes[1].patch.time!).toBe(true);
    const result = applyDayReplanChanges(data.tasks, data.tasks, [changes[1]], date);
    expect(result[0]).toBe(data.tasks[0]);
    expect(result[1].time).toBe(changes[1].patch.time);
    expect(result[1].dueDate).toBe(date);
  });
  it("rejects a stale snapshot atomically instead of overwriting edits or reviving a deleted task", () => {
    const data = input(); const changes = buildDayReplan(data).changes;
    const current = [{ ...data.tasks[0], note: "Ny anteckning" }];
    expect(() => applyDayReplanChanges(current, data.tasks, changes, date)).toThrow(/ändrats/);
    expect(current[0]).toMatchObject({ note: "Ny anteckning", time: "14:00" });
    expect(() => applyDayReplanChanges([], data.tasks, changes, date)).toThrow(/ändrats/);
  });
});
