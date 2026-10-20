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
vi.mock("@/pages/energy-map", () => ({ EnergyContent: ({ readOnly }: { readOnly?: boolean }) => <div data-testid="energy-history" data-readonly={String(!!readOnly)} /> }));
vi.mock("@/pages/energy-flow", () => ({ EnergyFlowContent: () => <div data-testid="existing-energy-tools" /> }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: () => [false, vi.fn()] }));
vi.mock("@/hooks/use-energy-pattern", () => ({ useEnergyPattern: () => ({ pattern: { reliable: false } }) }));
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
  it("reuses Today's existing check-in destination instead of owning another draft", () => {
    render(<BatteryPage />);
    expect(screen.getByRole("link", { name: "Logga energi & mående" })).toHaveAttribute("href", "/idag");
    expect(screen.queryByTestId("existing-checkin")).not.toBeInTheDocument();
  });

  it("keeps the battery link for entries on other pages", () => {
    render(<CapacitySelector />);
    expect(screen.getByRole("link", { name: "Checka in" })).toHaveAttribute(
      "href",
      "/mitt-batteri",
    );
  });

  it("keeps registered 25 percent, read-only energy history and the existing energy tools", () => {
    capacity.percent = 25;
    render(<BatteryPage />);
    expect(screen.getByTestId("capacity-summary")).toHaveTextContent("25 %");
    expect(screen.queryByText(/Din uppskattade energi/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Historik" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Historik" }));
    fireEvent.click(screen.getByRole("tab", { name: /Energi/ }));
    expect(screen.getByTestId("energy-history")).toHaveAttribute("data-readonly", "true");
    fireEvent.click(screen.getByRole("button", { name: "Vad påverkar min energi?" }));
    expect(screen.getByTestId("existing-energy-tools")).toBeVisible();
    expect(screen.getByRole("link", { name: "Logga energi & mående" })).toHaveAttribute("href", "/idag");
    capacity.percent = null;
  });
});
