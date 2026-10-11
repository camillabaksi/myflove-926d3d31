import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BatteryPage from "./battery";
import CapacitySelector from "@/components/capacity-selector";

vi.mock("wouter", () => ({
  useLocation: () => ["/mitt-batteri", vi.fn()],
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/myflove", () => ({ MyFloveHeader: () => null }));
vi.mock("@/components/myflove/block", () => ({
  MyFlovePageGrid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/myflove/expandable-block", () => ({ ExpandableBlock: () => null }));
vi.mock("@/components/energy-battery", () => ({ default: () => null }));
vi.mock("@/components/patterns-card", () => ({ default: () => null }));
vi.mock("@/components/cycle-card", () => ({ default: () => null }));
vi.mock("@/components/battery-today", () => ({ default: () => null }));
vi.mock("@/components/day-edges-checkin", () => ({ default: () => null }));
vi.mock("@/components/day-energy-flow", () => ({ default: () => null }));
vi.mock("@/components/impact-checkin", () => ({ default: () => null }));
vi.mock("@/components/simple-checkin", () => ({
  default: ({ source }: { source: string }) => (
    <label data-testid="existing-checkin" data-source={source}>
      Anteckning
      <input aria-label="Anteckning" />
    </label>
  ),
}));
vi.mock("@/pages/mood", () => ({ MoodContent: () => null }));
vi.mock("@/pages/energy-map", () => ({ EnergyContent: () => null }));
vi.mock("@/pages/energy-flow", () => ({ EnergyFlowContent: () => null }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/hooks/use-user-profile", () => ({ useUserProfile: () => ({ name: "Cam" }) }));
vi.mock("@/hooks/use-language", () => ({
  useLang: () => ({ lang: "sv", t: (text: string) => text }),
}));
vi.mock("@/hooks/use-energy-battery", () => ({
  useEnergyBattery: () => ({ reading: { now: 50 } }),
}));
vi.mock("@/hooks/use-flowscore", () => ({ useFlowScore: () => ({ flow: { factors: [] } }) }));
const capacity = vi.hoisted(() => ({ percent: null as number | null }));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => capacity }));

describe("battery check-in entry", () => {
  it("opens and focuses the existing check-in without navigating or resetting its draft", () => {
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scroll,
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    render(<BatteryPage />);
    const section = screen.getByRole("button", { name: "Logga energi & mående" });
    expect(section).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("existing-checkin")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Checka in" }));
    expect(section).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("existing-checkin")).toHaveAttribute("data-source", "mitt-batteri");
    expect(document.activeElement).toHaveAttribute("aria-label", "Logga energi & mående");
    expect(scroll).toHaveBeenCalledWith({ block: "start" });
    fireEvent.change(screen.getByRole("textbox", { name: "Anteckning" }), {
      target: { value: "Påbörjad text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Checka in" }));
    expect(screen.getByRole("textbox", { name: "Anteckning" })).toHaveValue("Påbörjad text");
  });

  it("keeps the battery link for entries on other pages", () => {
    render(<CapacitySelector />);
    expect(screen.getByRole("link", { name: "Checka in" })).toHaveAttribute(
      "href",
      "/mitt-batteri",
    );
  });

  it("keeps the registered capacity first and lets an existing value be logged again", () => {
    capacity.percent = 25;
    render(<BatteryPage />);
    expect(screen.getByTestId("capacity-summary")).toHaveTextContent("Din kapacitet idag");
    expect(screen.getByTestId("capacity-summary")).toHaveTextContent("25 %");
    expect(screen.queryByText(/Din uppskattade energi/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Historik & mönster" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    const buttons = screen.getAllByRole("button", { name: "Logga energi & mående" });
    fireEvent.click(buttons[0]);
    expect(screen.getByTestId("existing-checkin")).toBeVisible();
    capacity.percent = null;
  });
});
