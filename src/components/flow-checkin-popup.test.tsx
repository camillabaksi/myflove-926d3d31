import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlowCheckinPopup from "@/components/flow-checkin-popup";

const SEEN_KEY = "myflove-flow-checkin-seen";

vi.mock("@/components/simple-checkin", () => ({
  default: ({ presentation }: { presentation?: string }) => (
    <div data-testid="central-checkin" data-presentation={presentation}>
      Logga energi &amp; mående
    </div>
  ),
}));

vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => ({ todayMoods: [], todayEnergyEntries: [] }),
}));

/** Flyttar klockan till ett känt tidsfönster utan att röra övrig logik. */
function atHour(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  vi.setSystemTime(d);
}

/** Låt React avsluta öppningen och modalens effekter innan vi klickar. */
async function advanceTime(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("Paces mjuka check-in-popup", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(async () => {
    cleanup();
    try {
      // Radix återställer fokus i en timer efter nedmontering. Kör den medan DOM finns kvar.
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("bjuder in på morgonen och öppnar den befintliga centrala loggningen", async () => {
    atHour(8);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<FlowCheckinPopup />);
    await advanceTime(2000);

    await waitFor(() => expect(screen.getByTestId("flow-checkin-popup")).toBeInTheDocument());
    expect(screen.getByText("God morgon! 💜")).toBeInTheDocument();
    expect(screen.getByText(/Hur var natten\?/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Logga hur jag mår/ }));
    expect(screen.getByTestId("central-checkin")).toBeInTheDocument();
    expect(screen.getByTestId("central-checkin")).toHaveAttribute("data-presentation", "dialog");
  });

  it("visar kvällens text på kvällen", async () => {
    atHour(20);
    render(<FlowCheckinPopup />);
    await advanceTime(2000);
    await waitFor(() => expect(screen.getByText("God kväll! 💜")).toBeInTheDocument());
  });

  it("visas inte alls utanför tidsfönstren", async () => {
    atHour(3);
    render(<FlowCheckinPopup />);
    await advanceTime(2000);
    expect(screen.queryByTestId("flow-checkin-popup")).not.toBeInTheDocument();
  });

  it("'Hoppa över' stänger utan skuld och gäller resten av fönstret", async () => {
    atHour(13);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const view = render(<FlowCheckinPopup />);
    await advanceTime(2000);

    await waitFor(() => expect(screen.getByText("Hej igen! 💜")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Hoppa över" }));

    await waitFor(() => expect(screen.queryByTestId("flow-checkin-popup")).not.toBeInTheDocument());
    expect(window.localStorage.getItem(SEEN_KEY)).toContain("dag");

    view.unmount();
    render(<FlowCheckinPopup />);
    await advanceTime(2000);
    expect(screen.queryByTestId("flow-checkin-popup")).not.toBeInTheDocument();
  });
});
