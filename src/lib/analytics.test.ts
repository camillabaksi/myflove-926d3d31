import { describe, it, expect, beforeEach, vi } from "vitest";

const logSpy = vi.fn(() => Promise.resolve({ ok: true }));
vi.mock("@/lib/analytics.functions", () => ({
  logAnalyticsEventFn: (args: unknown) => logSpy(args as never),
}));
vi.mock("@/lib/usage-local", () => ({ recordUsage: vi.fn() }));

import { track, resetAnalyticsDedupe } from "@/lib/analytics";
import { setAnalyticsSink, type AnalyticsSinkEvent } from "@/lib/analytics-events";

describe("analytics: exakt ett event per handling", () => {
  let sink: AnalyticsSinkEvent[] = [];

  beforeEach(() => {
    window.localStorage.clear();
    logSpy.mockClear();
    resetAnalyticsDedupe();
    sink = [];
    setAnalyticsSink((e) => sink.push(e));
  });

  it("loggar ett centralt event exakt en gång (en väg ut, ingen dubblett)", () => {
    track("task_completed", { source: "app" });
    expect(sink).toHaveLength(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(sink[0]!.section).toBe("tasks");
  });

  it("täcker alla prioriterade flöden med ett event vardera", () => {
    const flows = [
      "signup_completed",
      "login",
      "onboarding_started",
      "onboarding_completed",
      "app_opened",
      "home_viewed",
      "flow_opened",
      "quickflow_created",
      "task_created",
      "task_completed",
      "my_day_viewed",
      "battery_checkin_completed",
      "mood_checkin_completed",
      "plan_created",
      "reminder_created",
      "reminder_completed",
      "install_completed",
    ] as const;
    for (const name of flows) track(name);
    expect(sink.map((e) => e.name)).toEqual([...flows]);
    expect(logSpy).toHaveBeenCalledTimes(flows.length);
  });

  it("dubbelloggar inte snabba upprepade vy-event", () => {
    track("battery_opened", { source: "hem" });
    track("battery_opened", { source: "hem" });
    expect(sink).toHaveLength(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("dedupliceras aldrig för riktiga handlingar", () => {
    track("task_completed");
    track("task_completed");
    expect(sink).toHaveLength(2);
  });

  it("filtrerar alltid bort känsligt innehåll", () => {
    track("mood_checkin_completed", {
      source: "ma-bra",
      mood: 3,
      note: "jag mår dåligt",
      medication: "concerta",
      amount: 4200,
      email: "a@b.se",
    } as never);
    expect(sink[0]!.payload).toEqual({ source: "ma-bra" });
    const sent = logSpy.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(JSON.stringify(sent)).not.toMatch(/concerta|dåligt|4200|a@b\.se/);
  });

  it("respekterar användarens avstängning av statistik", () => {
    window.localStorage.setItem("myflove-analytics-opt-out", "1");
    track("task_created");
    expect(sink).toHaveLength(0);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
