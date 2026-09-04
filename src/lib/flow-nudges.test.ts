import { describe, expect, it } from "vitest";
import { buildFlowNudges } from "@/lib/flow-nudges";

const now = new Date(2026, 8, 4, 8, 0, 0);

describe("buildFlowNudges", () => {
  it("frågar om ork när inget loggats idag", () => {
    const nudges = buildFlowNudges({
      now,
      orkValue10: null,
      openQuickflowCount: 0,
      timedTodayCount: 0,
    });
    expect(nudges.map((n) => n.key)).toEqual(["flow-ork-2026-09-04"]);
  });

  it("tystnar när orken redan är loggad och dagen är lugn", () => {
    expect(
      buildFlowNudges({ now, orkValue10: 7, openQuickflowCount: 2, timedTodayCount: 1 }),
    ).toEqual([]);
  });

  it("puffar om en tung dag vid låg ork", () => {
    const nudges = buildFlowNudges({
      now,
      orkValue10: 3,
      openQuickflowCount: 0,
      timedTodayCount: 4,
    });
    expect(nudges).toHaveLength(1);
    expect(nudges[0]?.key).toBe("flow-latt-dag-2026-09-04");
    expect(nudges[0]?.body).toContain("4 tider");
  });

  it("puffar om en full Quickflow-inkorg", () => {
    const nudges = buildFlowNudges({
      now,
      orkValue10: 8,
      openQuickflowCount: 9,
      timedTodayCount: 0,
    });
    expect(nudges[0]?.key).toBe("flow-quickflow-2026-09-04");
    expect(nudges[0]?.url).toBe("/quickflow");
  });

  it("ger samma nyckel hela dagen så puffen bara skickas en gång", () => {
    const later = new Date(2026, 8, 4, 19, 30, 0);
    const a = buildFlowNudges({
      now,
      orkValue10: null,
      openQuickflowCount: 0,
      timedTodayCount: 0,
    });
    const b = buildFlowNudges({
      now: later,
      orkValue10: null,
      openQuickflowCount: 0,
      timedTodayCount: 0,
    });
    expect(a[0]?.key).toBe(b[0]?.key);
  });
});
