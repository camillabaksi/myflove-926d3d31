import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { TrainingProgram } from "@/lib/training.functions";
import { DEFAULT_REQUEST, generateWorkout } from "@/lib/workout-generator";
import { sessionFromWorkout } from "@/lib/training-program";

const fixture = vi.hoisted(() => ({
  program: null as TrainingProgram | null,
  generate: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/training.functions", () => ({ generateTrainingProgram: fixture.generate }));
vi.mock("@/lib/cloud-storage", async () => {
  const { useState } = await import("react");
  return {
    useCloudSyncedStorage: (key: string, initial: unknown) =>
      useState(() =>
        key === "myflove-training" ? { ...(initial as object), program: fixture.program } : initial,
      ),
  };
});
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/myflove/block", () => ({
  MyFlovePageGrid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/area-focus", () => ({ default: () => null }));
vi.mock("@/components/adaptive-intent-prompt", () => ({ default: () => null }));
vi.mock("@/components/myflove/motion", () => ({ MyFloveThinking: () => <p>Skapar…</p> }));
vi.mock("@/components/collapsible-section", () => ({
  default: ({
    title,
    actions,
    children,
  }: {
    title: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {actions}
      {children}
    </section>
  ),
}));
vi.mock("@/components/workout/workout-builder-panel", () => ({
  default: ({
    programWorkout,
    showBuilder,
  }: {
    programWorkout?: { title: string };
    showBuilder: boolean;
  }) => (showBuilder ? <p>Öppet bildpass: {programWorkout?.title}</p> : null),
}));
vi.mock("@/lib/health-steps", () => ({
  isHealthAppAvailable: async () => false,
  openHealthSettings: vi.fn(),
  readStepsForDays: async () => [],
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: fixture.toast }) }));

import TrainingPage from "./training";

async function openPrograms() {
  render(<TrainingPage />);
  fireEvent.click(screen.getByRole("button", { name: /^Träningsprogram/ }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Skapa manuellt" })).toBeVisible());
}

beforeEach(() => {
  fixture.program = null;
  fixture.generate.mockReset();
  fixture.toast.mockReset();
});

describe("integrated training programs", () => {
  it("creates a manual visual program from empty state on multiple chosen days", async () => {
    await openPrograms();
    fireEvent.click(screen.getByRole("button", { name: "Skapa manuellt" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Namn på passet"), {
      target: { value: "Mitt mjuka pass" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Fre" }));
    fireEvent.change(within(dialog).getByLabelText("Lägg till en övning"), {
      target: { value: "sit-to-stand" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Set för/), { target: { value: "2" } });
    fireEvent.change(within(dialog).getByLabelText("Maxtid (minuter)"), { target: { value: "15" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getAllByText("Mitt mjuka pass")).toHaveLength(2);
    expect(screen.getAllByText(/15 min/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Öppna bildpasset" })).toHaveLength(2);
    expect(fixture.generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Öppna bildpasset" })[1]!);
    expect(screen.getByText("Öppet bildpass: Mitt mjuka pass")).toBeVisible();
  });

  it("keeps existing text programs when Pace fails and lets the user choose manual creation", async () => {
    fixture.program = {
      intro: "Mitt gamla program",
      note: "Behåll",
      sessions: [
        {
          day: "Tisdag",
          title: "Min promenad",
          type: "kondition",
          minutes: 20,
          exercises: ["Gå i egen takt"],
        },
      ],
    };
    fixture.generate.mockRejectedValue(new Error("Försök igen eller skapa manuellt"));
    await openPrograms();
    fireEvent.click(screen.getByRole("button", { name: "Skapa med Pace" }));
    fireEvent.change(screen.getByLabelText("Ditt träningsmål"), {
      target: { value: "Mer styrka" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skapa nytt program med Pace" }));
    await waitFor(() =>
      expect(fixture.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      ),
    );
    expect(screen.getByText("Min promenad")).toBeVisible();
    expect(screen.getByText(/Gå i egen takt/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Skapa manuellt" }));
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("shows a generated weekly visual program and preserves visuals when editing", async () => {
    const workout = generateWorkout({ ...DEFAULT_REQUEST, minutes: 20 });
    fixture.generate.mockResolvedValue({
      intro: "Bildprogram",
      note: "I din takt",
      sessions: [sessionFromWorkout(workout, "Måndag")],
    });
    await openPrograms();
    fireEvent.click(screen.getByRole("button", { name: "Skapa med Pace" }));
    fireEvent.change(screen.getByLabelText("Ditt träningsmål"), {
      target: { value: "Mer styrka" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skapa mitt program med Pace" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Öppna bildpasset" })).toBeVisible(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ändra passet" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Namn på passet"), {
      target: { value: "Mitt nya namn" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara" }));
    await waitFor(() => expect(screen.getByText("Mitt nya namn")).toBeVisible());
    expect(screen.getByRole("button", { name: "Öppna bildpasset" })).toBeVisible();
  });
});
