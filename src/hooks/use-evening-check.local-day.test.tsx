import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayISO } from "@/lib/day";
import { useEveningCheck } from "./use-evening-check";

vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: <T,>(_key: string, initial: T) => useState(initial),
}));

const priorTimezone = process.env.TZ;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  process.env.TZ = "Europe/Stockholm";
});
afterEach(() => {
  vi.useRealTimers();
  if (priorTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = priorTimezone;
});

describe("evening check-in uses Idag's local calendar day", () => {
  it("records the local Saturday instead of the preceding UTC Friday after midnight in Sweden", () => {
    vi.setSystemTime(new Date("2026-10-23T22:30:00.000Z"));
    expect(todayISO()).toBe("2026-10-24");
    const { result } = renderHook(() => useEveningCheck());
    act(() => result.current.logEvening("som-vantat", { done: 2, planned: 3 }));
    expect(result.current.evening).toMatchObject({ day: "2026-10-24", answer: "som-vantat" });
    expect(result.current.eveningHistory).toHaveLength(1);
  });
});
