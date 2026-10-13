import { describe, expect, it, vi } from "vitest";
import { addToChildSchedules, type ChildScheduleInput } from "./add-child-schedule";
import type { Child, ChildItem } from "@/hooks/use-children";

const child = (id: string, owner_id = "owner"): Child => ({ id, owner_id, name: id, birthdate: null, color: "", note: null, helps: [], avatar: null });
const input = { title: "Frukost", date: "2026-10-13", time: "07:30", repeat: "weekly" as const, notes: "same chosen picture" };
const base = { owner: "owner", children: [child("a"), child("b"), child("foreign", "someone-else")], selectedIds: ["a", "b"], items: [] as ChildItem[], input, canContinue: () => true };
describe("Add one activity to several child schedules", () => {
  it("creates one independent activity per explicitly selected owned child with unchanged fields", async () => {
    const addItem = vi.fn(async (_value: ChildScheduleInput) => "created");
    const result = await addToChildSchedules({ ...base, selectedIds: ["a", "b", "a"], addItem });
    expect(result).toEqual({ created: ["a", "b"], skipped: [], failed: [] });
    expect(addItem.mock.calls.map(([value]) => value)).toEqual(["a", "b"].map(childId => ({ ...input, childId, kind: "activity" })));
  });
  it("rejects a foreign or empty selection before any writes", async () => {
    const addItem = vi.fn(async (_value: ChildScheduleInput) => "created");
    await expect(addToChildSchedules({ ...base, selectedIds: ["a", "foreign"], addItem })).rejects.toThrow();
    await expect(addToChildSchedules({ ...base, selectedIds: [], addItem })).rejects.toThrow();
    expect(addItem).not.toHaveBeenCalled();
  });
  it("skips an existing recurring occurrence and prepares a photo only for new rows", async () => {
    const existing = { id: "existing", child_id: "a", owner_id: "owner", kind: "activity", title: "Frukost", date: "2026-10-06", time: "07:30", repeat: "weekly", notes: null } as ChildItem;
    const addItem = vi.fn(async (_input: ChildScheduleInput) => "created"), fileForChild = vi.fn(async (id: string) => `photo-for-${id}`);
    const result = await addToChildSchedules({ ...base, items: [existing], addItem, fileForChild });
    expect(result).toEqual({ created: ["b"], skipped: ["a"], failed: [] });
    expect(fileForChild).toHaveBeenCalledExactlyOnceWith("b");
    expect(addItem).toHaveBeenCalledExactlyOnceWith({ ...input, childId: "b", kind: "activity", filePath: "photo-for-b" });
  });
  it("returns only failed children for a retry, without rolling back successful activities", async () => {
    const addItem = vi.fn(async (value: ChildScheduleInput) => { if (value.childId === "b") throw Error("network"); return "created"; });
    expect(await addToChildSchedules({ ...base, addItem })).toEqual({ created: ["a"], skipped: [], failed: ["b"] });
  });
  it("also skips legacy child tasks already displayed in the visual schedule", async () => {
    const existing = { id: "legacy", child_id: "a", owner_id: "owner", kind: "task", title: input.title, date: input.date, time: input.time, repeat: "none", notes: null } as ChildItem;
    const addItem = vi.fn(async (_value: ChildScheduleInput) => "created");
    const result = await addToChildSchedules({ ...base, items: [existing], addItem });
    expect(result).toEqual({ created: ["b"], skipped: ["a"], failed: [] });
    expect(addItem).toHaveBeenCalledOnce();
  });
  it("stops remaining writes if the account changes during a save", async () => {
    let current = true;
    const addItem = vi.fn(async () => { current = false; return "created"; });
    expect(await addToChildSchedules({ ...base, addItem, canContinue: () => current })).toEqual({ created: ["a"], skipped: [], failed: ["b"] });
    expect(addItem).toHaveBeenCalledOnce();
  });
});
