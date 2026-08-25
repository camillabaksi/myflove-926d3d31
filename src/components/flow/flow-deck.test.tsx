import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * Verifierar att Flow-decket alltid har exakt EN slide i DOM
 * (en sak i taget) och att slidens kontext ger rätt Flow-scen,
 * testat på mobilbredd (390 px).
 */

const toggleTask = vi.fn();
const snoozeTask = vi.fn();

const battery = { now: 70, peak: null as null | { label: string }, overloaded: false, trend: "jamn" as const };
const checkin = { moodValue: 4 as number | null, energyValue: 4 as number | null, logMood: vi.fn(), logEnergy: vi.fn() };
let weather: { temperature: number; city: string; code: number } | null = null;
let suggestionTask: { id: string; title: string } | null = null;

vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ activeTasks: [], toggleTask, snoozeTask }),
}));
vi.mock("@/hooks/use-energy-battery", () => ({
  useEnergyBattery: () => ({ reading: battery, items: [] }),
}));
vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => checkin,
}));
vi.mock("@/hooks/use-weather", () => ({
  useWeather: () => weather,
}));
vi.mock("@/components/focus-mode", () => ({
  default: () => null,
}));
vi.mock("@/lib/flow-engine", () => ({
  assessToday: () => ({ weight: "lagom" }),
  rankNow: () => [],
  suggestNow: () => ({
    task: suggestionTask,
    reason: "Den passar din energi nu.",
    minutes: 15,
  }),
}));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));

const FlowDeck = (await import("@/components/flow/flow-deck")).default;

const activeScene = () =>
  document.querySelector("[data-flow-character]")?.getAttribute("data-flow-scene");

beforeEach(() => {
  battery.now = 70;
  battery.overloaded = false;
  checkin.moodValue = 4;
  checkin.energyValue = 4;
  weather = null;
  suggestionTask = null;
});

describe("FlowDeck – en sak i taget", () => {
  it("renderar exakt en slide och en Flow-karaktär", () => {
    const { container } = render(<FlowDeck />);
    expect(container.querySelectorAll("[data-flow-slide]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(container.querySelector("[data-flow-slide]")).toHaveAttribute("data-flow-slide-active", "true");
  });

  it("behåller exakt en slide efter att man bläddrar framåt", () => {
    const { container } = render(<FlowDeck />);
    fireEvent.click(screen.getByLabelText("Nästa vy"));
    expect(container.querySelectorAll("[data-flow-slide]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-flow-character]")).toHaveLength(1);
    expect(container.querySelector("section")).toHaveAttribute("data-flow-current-slide", "1");
  });

  it("startar på intro med Flows hälsningsscen", () => {
    render(<FlowDeck />);
    expect(document.querySelector("[data-flow-slide]")).toHaveAttribute("data-flow-slide-id", "intro");
    expect(activeScene()).toBe("hello");
  });

  it("visar regnscen med paraply när vädret är blött", () => {
    weather = { temperature: 12, city: "Stockholm", code: 61 };
    render(<FlowDeck />);
    fireEvent.click(screen.getByLabelText("Nästa vy"));
    expect(document.querySelector("[data-flow-slide]")).toHaveAttribute("data-flow-slide-id", "weather");
    expect(activeScene()).toBe("rain");
    expect(document.querySelectorAll('[data-flow-prop="umbrella"]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll("[data-flow-character]")).toHaveLength(1);
  });

  it("visar hög energi-scen med batteri när batteriet är fullt", () => {
    battery.now = 82;
    render(<FlowDeck />);
    fireEvent.click(screen.getByLabelText("Nästa vy"));
    expect(activeScene()).toBe("energyHigh");
    expect(document.querySelectorAll('[data-flow-prop="battery"]').length).toBeGreaterThan(0);
  });

  it("visar återhämtningsscen när dagen är överbelastad", () => {
    battery.now = 25;
    battery.overloaded = true;
    render(<FlowDeck />);
    fireEvent.click(screen.getByLabelText("Nästa vy"));
    expect(document.querySelector("[data-flow-slide]")).toHaveAttribute("data-flow-slide-id", "rest");
    expect(activeScene()).toBe("rest");
    expect(document.querySelectorAll('[data-flow-prop="breathRing"]').length).toBeGreaterThan(0);
  });

  it("matchar förslagets scen mot uppgiftens innehåll", () => {
    suggestionTask = { id: "t1", title: "Dammsuga vardagsrummet" };
    render(<FlowDeck />);
    const nextButton = screen.getByLabelText("Nästa vy");
    for (let i = 0; i < 6; i++) {
      if (document.querySelector("[data-flow-slide]")?.getAttribute("data-flow-slide-id") === "suggestion") break;
      fireEvent.click(nextButton);
    }
    expect(document.querySelector("[data-flow-slide]")).toHaveAttribute("data-flow-slide-id", "suggestion");
    expect(activeScene()).toBe("clean");
    expect(document.querySelectorAll('[data-flow-prop="vacuum"]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll("[data-flow-character]")).toHaveLength(1);
  });

  it("har lika många prickar som slides och bara en aktiv", () => {
    const { container } = render(<FlowDeck />);
    const dots = screen.getAllByLabelText(/^Vy \d+ av \d+:/);
    expect(dots.length).toBeGreaterThan(1);
    expect(dots.filter((d) => d.getAttribute("aria-current") === "true")).toHaveLength(1);
    expect(container.querySelectorAll("[data-flow-slide]")).toHaveLength(1);
  });
});
