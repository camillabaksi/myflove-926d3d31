import { describe, it, expect } from "vitest";
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
