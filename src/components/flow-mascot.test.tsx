import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlowMascot } from "./flow-mascot";

/**
 * Flow ska synas tydligt utan att knuffa layouten:
 * rutan i flödet behåller sin storlek, bilden skalas inuti.
 */
describe("FlowMascot", () => {
  it("behåller layoutrutans storlek när Flow är optiskt större", () => {
    const { container } = render(<FlowMascot size="xs" bump alt="Flow" />);
    const box = container.querySelector("[data-flow-mascot]") as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.getAttribute("data-flow-bump")).toBe("true");
    // Rutan är låst till xs-storleken.
    expect(box.className).toContain("h-10");
    expect(box.className).toContain("w-10");
    // Bilden skalas i mitten utan att ändra rutan.
    const img = screen.getByAltText("Flow");
    expect(img.className).toContain("scale-125");
    expect(img.className).toContain("origin-center");
  });

  it("lämnar layouten orörd utan bump", () => {
    const { container } = render(<FlowMascot size="sm" alt="Flow utan bump" />);
    const box = container.querySelector("[data-flow-mascot]") as HTMLElement;
    expect(box.getAttribute("data-flow-bump")).toBe("false");
    expect(box.className).not.toContain("h-14 w-14");
    const img = screen.getByAltText("Flow utan bump");
    expect(img.className).toContain("h-14");
    expect(img.className).not.toContain("scale-125");
  });
});
