import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";

// Länkar testas som vanlig markup – routern behövs inte för den här kontrollen.
vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { render, screen } from "@testing-library/react";
import EnergyBattery from "@/components/energy-battery";

describe("Mitt batteri på Hem", () => {
  it("är ett enda helt klickbart kort som leder till Mitt batteri", () => {
    render(<EnergyBattery href="/mitt-batteri" />);
    const card = screen.getByTestId("battery-card");
    expect(card.tagName).toBe("A");
    expect(card.getAttribute("href")).toBe("/mitt-batteri");
    // Inga konkurrerande knappar inuti klickytan.
    expect(card.querySelectorAll("button")).toHaveLength(0);
  });

  it("behåller den utfällbara detaljvyn när kortet inte är en länk", () => {
    render(<EnergyBattery />);
    expect(screen.queryByTestId("battery-card")).toBeNull();
    expect(screen.getByRole("button", { expanded: false })).toBeTruthy();
  });
});
