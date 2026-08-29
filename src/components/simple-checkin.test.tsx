import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const logMood = vi.fn();
const logEnergy = vi.fn();
const addFactor = vi.fn(async () => undefined);
const trackCalls: { event: string; payload?: Record<string, unknown> }[] = [];

vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => ({ moodValue: null, energyValue: null, logMood, logEnergy }),
}));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({ addFactor }),
}));
vi.mock("@/hooks/use-flow-explainer", () => ({
  useFlowExplainer: () => ({ explain: () => null }),
}));
vi.mock("@/lib/analytics", () => ({
  track: (event: string, payload?: Record<string, unknown>) => {
    trackCalls.push({ event, payload });
  },
}));

import SimpleCheckin from "@/components/simple-checkin";

describe("Mitt batteri – den kanoniska loggningsvyn", () => {
  beforeEach(() => {
    logMood.mockClear();
    logEnergy.mockClear();
    addFactor.mockClear();
    trackCalls.length = 0;
  });

  it("visar ett enda loggningsformulär med knappen 'Logga energi & mående'", () => {
    render(<SimpleCheckin />);
    expect(screen.getByTestId("battery-log-form")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Logga energi & mående/i })).toBeTruthy();
  });

  it("låter användaren skriva fri text – men kräver den inte", () => {
    render(<SimpleCheckin />);
    const field = screen.getByPlaceholderText(/Sovit bara 4 timmar/i);
    expect((field as HTMLTextAreaElement).required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    expect(logEnergy).toHaveBeenCalledTimes(1);
  });

  it("sparar fritexten tillsammans med måendet i befintlig datamodell", () => {
    render(<SimpleCheckin />);
    fireEvent.change(screen.getByPlaceholderText(/Sovit bara 4 timmar/i), {
      target: { value: "Jag sov bara 4 timmar och är dessutom sjuk." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    expect(logMood).toHaveBeenCalledWith(
      expect.any(Number),
      "Jag sov bara 4 timmar och är dessutom sjuk.",
    );
  });

  it("skickar aldrig hälsotexten som analytics-payload", () => {
    render(<SimpleCheckin />);
    fireEvent.change(screen.getByPlaceholderText(/Sovit bara 4 timmar/i), {
      target: { value: "Jag är sjuk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    const serialized = JSON.stringify(trackCalls);
    expect(serialized).not.toContain("sjuk");
  });
});
