import { describe, expect, it } from "vitest";
import { addPaceShoppingItems, allowedFlowMoveDate, flowEditTaskPatch, matchTask, paceActionItemId, paceActionStepId, paceActionTaskId, parseFlowReply, recordPaceShoppingReceipt, validFlowDate, type FlowAction } from "./flow-actions";

const tasks = [
  { id: "mon", title: "Handla", dueDate: "2026-10-19" },
  { id: "fri", title: "Handla", dueDate: "2026-10-23" },
  { id: "dentist", title: "Ringa tandläkaren", dueDate: "2026-10-24" },
];
const action = (patch: Partial<FlowAction>): FlowAction => ({ kind: "andra", ...patch });

describe("Pace task actions share identity with Idag and Kalender", () => {
  it("uses the same task identity on a historical chat replay and different identities for separate actions", () => {
    const message = "8734a390-b95c-4981-9c5d-1298534245a2";
    const another = "5ed34332-4619-4e95-8107-130eaa87fc4b";
    const originalId = paceActionTaskId(`${message}:0`);
    expect(originalId).toBe("pace-action-8734a390-b95c-4981-9c5d-1298534245a2-0");
    expect(paceActionTaskId(`${message}:0`)).toBe(originalId);
    expect(paceActionTaskId(`${message}:1`)).not.toBe(originalId);
    expect(paceActionTaskId(`${another}:0`)).not.toBe(originalId);
    expect(paceActionTaskId("tmp-a-123:0")).toBeUndefined();
    expect(paceActionTaskId("not-a-uuid:0")).toBeUndefined();
    expect(paceActionTaskId(`${message}:-1`)).toBeUndefined();
    expect(paceActionTaskId(`${message}:1.2`)).toBeUndefined();
  });

  it("gives every shopping line and every task-specific step a unique saved-proposal identity", () => {
    const first = "8734a390-b95c-4981-9c5d-1298534245a2:0";
    const second = "8734a390-b95c-4981-9c5d-1298534245a2:1";
    const firstItem = paceActionItemId(first, 0);
    expect(firstItem).toBe("pace-action-8734a390-b95c-4981-9c5d-1298534245a2-0-item-0");
    expect(paceActionItemId(first, 0)).toBe(firstItem);
    expect(paceActionItemId(first, 1)).not.toBe(firstItem);
    expect(paceActionItemId(second, 0)).not.toBe(firstItem);
    expect(paceActionItemId("tmp-a-1:0", 0)).toBeUndefined();
    expect(paceActionItemId(first, -1)).toBeUndefined();
    expect(paceActionStepId(first, "task-a", 0)).not.toBe(paceActionStepId(first, "task-b", 0));
    expect(paceActionStepId(first, "task-a", 0)).not.toBe(paceActionStepId(first, "task-a", 1));
    expect(paceActionStepId("tmp-a-1:0", "task-a", 0)).toBeUndefined();
  });

  it("records only successfully acknowledged shopping items and retries only missing ones", async () => {
    const key = "8734a390-b95c-4981-9c5d-1298534245a2:2";
    const receipts: string[] = [];
    let failSecond = true;
    const added: string[] = [];
    const add = async (title: string, id: string) => {
      if (title === "mjölk" && failSecond) throw new Error("Nätverksfel");
      added.push(id);
    };
    const confirm = (id: string) => { receipts.push(id); };
    await expect(addPaceShoppingItems(key, ["bröd", "mjölk", "ägg"], new Set(receipts), add, confirm, () => true))
      .rejects.toThrow("Nätverksfel");
    expect(receipts).toEqual([paceActionItemId(key, 0)]);
    expect(added).toEqual([paceActionItemId(key, 0)]);
    failSecond = false;
    expect(await addPaceShoppingItems(key, ["bröd", "mjölk", "ägg"], new Set(receipts), add, confirm, () => true))
      .toBe(2);
    expect(added).toEqual([paceActionItemId(key, 0), paceActionItemId(key, 1), paceActionItemId(key, 2)]);
    expect(await addPaceShoppingItems(key, ["bröd", "mjölk", "ägg"], new Set(receipts), add, confirm, () => true))
      .toBe(0);
    expect(recordPaceShoppingReceipt(receipts.map(id => ({ id })), receipts[0]!)).toHaveLength(3);
  });

  it("never acknowledges an unsaved message or a shopping mutation after account change", async () => {
    const ids: string[] = [];
    const key = "8734a390-b95c-4981-9c5d-1298534245a2:3";
    let sameOwner = true;
    await expect(addPaceShoppingItems("tmp-a-1:0", ["bröd"], new Set(), async () => {}, id => ids.push(id), () => true))
      .rejects.toThrow(/unsaved/i);
    expect(ids).toEqual([]);
    await expect(addPaceShoppingItems(key, ["bröd"], new Set(), async () => {
      sameOwner = false;
    }, id => ids.push(id), () => sameOwner)).rejects.toThrow(/account changed/i);
    expect(ids).toEqual([]);
  });

  it("uses an explicit stable ID even when titles match on different days", () => {
    expect(matchTask(action({ taskId: "fri", taskTitle: "Handla" }), tasks)).toBe(tasks[1]);
    expect(matchTask(action({ taskId: "mon", taskTitle: "Handla" }), tasks)).toBe(tasks[0]);
  });

  it("refuses ambiguous names instead of editing or removing the first matching activity", () => {
    expect(matchTask(action({ taskTitle: "Handla" }), tasks)).toBeUndefined();
    expect(matchTask(action({ taskTitle: "Hand" }), tasks)).toBeUndefined();
    expect(matchTask(action({ taskId: "missing", taskTitle: "Handla" }), tasks)).toBeUndefined();
  });

  it("never falls back from a stale or mismatched ID to a different task", () => {
    expect(matchTask(action({ taskId: "gone", taskTitle: "Ringa tandläkaren" }), tasks)).toBeUndefined();
    expect(matchTask(action({ taskId: "fri", taskTitle: "Ringa tandläkaren" }), tasks)).toBeUndefined();
  });

  it("still supports a unique older title-only suggestion without extra taps", () => {
    expect(matchTask(action({ taskTitle: "ringa tandläkaren" }), tasks)).toBe(tasks[2]);
    expect(matchTask(action({ taskTitle: "tandläkaren" }), tasks)).toBe(tasks[2]);
    expect(matchTask(action({ taskTitle: "Ha" }), tasks)).toBeUndefined();
  });

  it("edits date, time and title in one patch without resetting stored reminders", () => {
    const task = { title: "Ringa tandläkaren", dueDate: "2026-10-24", time: "09:00", reminderMinutesBefore: 10, area: "privat" };
    const patch = flowEditTaskPatch(action({ title: "Ring tandläkaren", date: "2026-10-22", time: "11:00" }), task);
    expect(patch).toEqual({ title: "Ring tandläkaren", dueDate: "2026-10-22", time: "11:00" });
    expect(patch).not.toHaveProperty("reminderMinutesBefore");
    expect({ ...task, ...patch }).toMatchObject({ reminderMinutesBefore: 10, area: "privat" });
    expect(flowEditTaskPatch(action({}), task)).toEqual({});
  });

  it("keeps a specified past date on new or edited items instead of silently assigning today", () => {
    const past = parseFlowReply('Förslag: ```flow-action\n[{"kind":"ny","title":"Promenad","date":"2026-10-22"}, {"kind":"andra","taskId":"mon","date":"2026-10-21"}]\n```');
    expect(past.actions).toMatchObject([{ kind: "ny", date: "2026-10-22" }, { kind: "andra", date: "2026-10-21" }]);
    expect(validFlowDate("2026-10-22")).toBe(true);
    expect(allowedFlowMoveDate("2026-10-22", "2026-10-23")).toBeUndefined();
    expect(allowedFlowMoveDate("2026-10-23", "2026-10-23")).toBe("2026-10-23");
    expect(allowedFlowMoveDate("2026-10-24", "2026-10-23")).toBe("2026-10-24");
    expect(allowedFlowMoveDate(undefined, "2026-10-23")).toBeUndefined();
  });

  it("rejects non-existent calendar dates from assistant output", () => {
    for (const invalid of ["2026-02-30", "2026-13-01", "2026-00-12", "2026-10-99", "2026-1-2"]) {
      expect(validFlowDate(invalid)).toBe(false);
      expect(allowedFlowMoveDate(invalid, "2026-10-23")).toBeUndefined();
      const parsed = parseFlowReply(["```flow-action", JSON.stringify({ kind: "ny", title: "Test", date: invalid }), "```"].join("\n"));
      expect(parsed.actions[0]?.date).toBeUndefined();
    }
    expect(validFlowDate("2028-02-29")).toBe(true);
  });
});
