import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ activeTasks: [], toggleTask: vi.fn(), snoozeTask: vi.fn() }) }));
vi.mock("@/hooks/use-energy-battery", () => ({ useEnergyBattery: () => ({ reading: { now: 70, peak: null, overloaded: false, trend: "jamn" }, items: [] }) }));
vi.mock("@/hooks/use-quick-checkin", () => ({ useQuickCheckin: () => ({ moodValue: 4, energyValue: 4, logMood: vi.fn(), logEnergy: vi.fn() }) }));
vi.mock("@/hooks/use-weather", () => ({ useWeather: () => null }));
vi.mock("@/components/focus-mode", () => ({ default: () => null }));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));
const FlowDeck = (await import("@/components/flow/flow-deck")).default;
describe("dbg", () => {
  it("a", () => {
    const { container } = render(<FlowDeck />);
    console.log(container.querySelector("[data-flow-slide]")?.getAttribute("data-flow-slide-id"), container.querySelectorAll("[aria-current]").length, window.location.href);
    expect(1).toBe(1);
  });
});
