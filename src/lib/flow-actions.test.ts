import { describe, expect, it } from "vitest";
import { allowedFlowMoveDate, flowEditTaskPatch, matchTask, parseFlowReply, validFlowDate, type FlowAction } from "./flow-actions";

const tasks = [
  { id: "mon", title: "Handla", dueDate: "2026-10-19" },
  { id: "fri", title: "Handla", dueDate: "2026-10-23" },
  { id: "dentist", title: "Ringa tandläkaren", dueDate: "2026-10-24" },
];
const action = (patch: Partial<FlowAction>): FlowAction => ({ kind: "andra", ...patch });

describe("Pace task actions share identity with Idag and Kalender", () => {
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
