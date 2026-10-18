import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Workout } from "@/lib/workout-generator";
import type { ReactNode } from "react";
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));

const fixture = vi.hoisted(() => ({
  saved: [],
  logs: [],
  saveWorkout: vi.fn(),
  removeWorkout: vi.fn(),
  logWorkout: vi.fn(),
  toast: vi.fn(),
  addTask: vi.fn(),
}));
vi.mock("@/hooks/use-workouts", () => ({ useWorkouts: () => fixture }));
vi.mock("@/hooks/use-capacity-mode", () => ({ useCapacityMode: () => ({ percent: 65 }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ addTask: fixture.addTask }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: fixture.toast }) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/workout-ai.functions", () => ({ generateAiWorkout: vi.fn() }));
vi.mock("@/components/workout/exercise-card", () => ({ default: () => <div>Övningskort</div> }));
vi.mock("@/lib/workout-voice", () => ({
  announceWorkout: vi.fn(),
  isWorkoutSoundEnabled: () => false,
  setWorkoutSoundEnabled: vi.fn(),
  subscribeWorkoutSound: () => () => {},
}));
import WorkoutBuilderPanel from "./workout-builder-panel";

const workout: Workout = {
  id: "saved",
  title: "Mitt pass",
  note: "",
  createdAt: 0,
  minutes: 20,
  energy: "normal",
  place: "hemma",
  equipment: ["kroppsvikt"],
  focus: ["helkropp"],
  limitations: [],
  intent: "styrka",
  kcalLow: 50,
  kcalHigh: 80,
  blocks: [{ exerciseId: "sit-to-stand", sets: 1, reps: 10, restSeconds: 0, section: "huvuddel" }],
};
function open(selected = workout, onWorkoutFinished = vi.fn()) {
  return render(
    <WorkoutBuilderPanel
      showBuilder
      programWorkout={selected}
      onOpenBuilder={vi.fn()}
      onCloseBuilder={vi.fn()}
      onAddToProgram={vi.fn()}
      onWorkoutFinished={onWorkoutFinished}
    />,
  );
}
beforeEach(() => vi.clearAllMocks());

describe("saved workout player", () => {
  it("logs a time-limited partial pass without completing the whole program", () => {
    vi.useFakeTimers();
    try {
      const finished = vi.fn();
      open({ ...workout, blocks: [...workout.blocks, { exerciseId: "wall-sit", sets: 1,
        seconds: 400, restSeconds: 0, section: "huvuddel" }] }, finished);
      fireEvent.click(screen.getByRole("button", { name: "5 min" }));
      fireEvent.click(screen.getByRole("button", { name: "Starta med nedräkning" }));
      act(() => vi.advanceTimersByTime(5000));
      act(() => vi.advanceTimersByTime(40000));
      act(() => vi.advanceTimersByTime(5000));
      act(() => vi.advanceTimersByTime(250000));
      expect(screen.getByRole("heading", { name: "Passet avslutat" })).toBeVisible();
      expect(screen.getByText("Du slutförde 1 av 2 övningar.")).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Spara och logga passet" }));
      expect(fixture.logWorkout).toHaveBeenCalledWith(expect.objectContaining({ minutes: 5 }), 1);
      expect(finished).not.toHaveBeenCalled();
      expect(fixture.addTask).toHaveBeenCalledWith(expect.stringMatching(/^Del av träningspass/), expect.any(String), expect.not.objectContaining({ energyImpact: "gives" }));
    } finally { vi.useRealTimers(); }
  });
  it("offers time and start before the exercise list, preserving selected exercises on save", () => {
    open();
    const start = screen.getByRole("button", { name: "Starta med nedräkning" });
    expect(
      start.compareDocumentPosition(screen.getByText("Övningskort")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Maxtid i minuter (5–180)"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Spara" }));
    expect(fixture.saveWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ maxMinutes: 25, blocks: workout.blocks }),
    );
  });

  it("opens the actual illustrated countdown player with the chosen limit", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "5 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Starta med nedräkning" }));
    expect(screen.getByText(/Maxtid 5 min/)).toBeVisible();
    expect(screen.getByText("Gör dig redo", { selector: "h2" })).toBeVisible();
    expect(screen.getByRole("img", { name: /Sitt-till-stå/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "Pausa" })).toBeVisible();
  });

  it("lets the user clear the duration without silently starting with another time", () => {
    open();
    fireEvent.change(screen.getByLabelText("Maxtid i minuter (5–180)"), { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Starta med nedräkning" })).toBeDisabled();
  });
});
