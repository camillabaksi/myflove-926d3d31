import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkoutTimer } from "./use-workout-timer";
import type { TimelineStep } from "@/lib/workout-timeline";

const steps: TimelineStep[] = [
  {
    id: "work",
    kind: "arbete",
    blockIndex: 0,
    exerciseId: "wall-sit",
    exerciseName: "Test",
    setNumber: 1,
    totalSets: 1,
    seconds: 30,
    title: "Test",
    detail: "",
    announce: "Test",
  },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-12T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("workout playback time", () => {
  it("stops at the chosen active time, excluding a pause", () => {
    const onFinish = vi.fn();
    const completed = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutTimer(steps, {
        totalExercises: 1,
        limitSeconds: 10,
        onFinish,
        onStepComplete: completed,
      }),
    );
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.finished).toBe(false);
    expect(result.current.elapsedSeconds).toBe(4);
    expect(result.current.remaining).toBe(26);
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.finished).toBe(true);
    expect(result.current.elapsedSeconds).toBe(10);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(completed).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(60000));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("counts naturally finished work, while skipping does not count it", () => {
    const complete = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutTimer(steps, { totalExercises: 1, onStepComplete: complete }),
    );
    act(() => result.current.next());
    expect(result.current.finished).toBe(true);
    expect(complete).not.toHaveBeenCalled();
  });

  it("finishes a complete timeline before the maximum and records elapsed time", () => {
    const complete = vi.fn();
    const finish = vi.fn();
    const { result } = renderHook(() =>
      useWorkoutTimer(steps, {
        totalExercises: 1,
        limitSeconds: 120,
        onStepComplete: complete,
        onFinish: finish,
      }),
    );
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current.finished).toBe(true);
    expect(result.current.elapsedSeconds).toBe(30);
    expect(complete).toHaveBeenCalledWith(steps[0]);
    expect(finish).toHaveBeenCalledTimes(1);
  });
});
