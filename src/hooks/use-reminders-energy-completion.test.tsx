import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_DONE_EVENT, type ActivityDoneDetail } from "@/lib/activity-energy-event";

vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/flow-signal", () => ({ flowDone: vi.fn() }));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));

import { useReminders } from "@/hooks/use-data";

describe("One completion, one energy question across reminder entrypoints", () => {
  const events: ActivityDoneDetail[] = [];
  const listener = (event: Event) => events.push((event as CustomEvent<ActivityDoneDetail>).detail);

  beforeEach(() => {
    events.length = 0;
    window.addEventListener(ACTIVITY_DONE_EVENT, listener);
  });
  afterEach(() => window.removeEventListener(ACTIVITY_DONE_EVENT, listener));

  it("offers energy feedback for a one-off reminder completed through the source (including notification actions)", () => {
    const { result } = renderHook(() => useReminders());
    act(() => result.current.addReminder("Hämta paket", "2026-10-22", "14:00"));
    const saved = result.current.reminders[0]!;
    act(() => result.current.toggleReminder(saved.id));
    expect(result.current.reminders[0]?.completed).toBe(true);
    expect(events).toEqual([{ id: `rem-${saved.id}`, title: "Hämta paket", dueDate: "2026-10-22" }]);

    act(() => result.current.toggleReminder(saved.id)); // reopen, never log energy
    expect(result.current.reminders[0]?.completed).toBe(false);
    expect(events).toHaveLength(1);
  });

  it("leaves recurring series to their selected occurrence and never emits a whole-series prompt", () => {
    const { result } = renderHook(() => useReminders());
    act(() => result.current.addReminder("Läsa bok", "2026-10-20", "20:00", "daily"));
    const saved = result.current.reminders[0]!;
    act(() => result.current.toggleReminder(saved.id));
    expect(events).toEqual([]);
  });

  it("never asks for energy on a continuous untimed period", () => {
    const { result } = renderHook(() => useReminders());
    act(() => result.current.addReminder("Kurs", "2026-10-22", undefined, "none", undefined, undefined, undefined, undefined, "2026-11-10"));
    act(() => result.current.toggleReminder(result.current.reminders[0]!.id));
    expect(events).toEqual([]);
  });
});
