import { describe, expect, it } from "vitest";
import { activityEnergySourceId } from "@/lib/activity-energy-event";
import { historyEnergyFlowItem } from "./history-energy-entry";

describe("History uses the shared completed-activity energy workflow", () => {
  it("retains a task ID and planned date for the energy factor and instance journal", () => {
    const result = historyEnergyFlowItem({
      sourceId: "task-abc", title: "Handla", plannedDate: "2026-10-21",
    });
    expect(result).toMatchObject({ id: "task-abc", title: "Handla", dueDate: "2026-10-21" });
    expect(activityEnergySourceId(result.id)).toBe("task-abc");
  });

  it("converts recurring reminder history IDs to the same prompt ID used by Today", () => {
    const result = historyEnergyFlowItem({
      sourceId: "reminder-abc", title: "Ta en promenad", plannedDate: "2026-10-21",
    });
    expect(result).toMatchObject({ id: "rem-abc", dueDate: "2026-10-21" });
    expect(activityEnergySourceId(result.id)).toBe("reminder-abc");
  });
});
