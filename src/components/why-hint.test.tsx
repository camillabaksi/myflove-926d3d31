import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WhyHint from "@/components/why-hint";

/**
 * "Varför?"-förklaringar ska vara stängda som standard, öppnas i sidflödet
 * under sin egen knapp (aldrig som popover) och fungera oberoende av varandra.
 */

describe("WhyHint", () => {
  it("är stängd som standard och öppnas/stängs vid tryck", () => {
    render(<WhyHint label="logga ork">Du får en bild av din dag.</WhyHint>);

    const button = screen.getByRole("button", { name: "Varför logga ork?" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Du får en bild av din dag.")).toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Du får en bild av din dag.")).toBeTruthy();

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Du får en bild av din dag.")).toBeNull();
  });

  it("kopplar knappen till förklaringen med aria-controls och unikt id", () => {
    render(<WhyHint>Förklaringstext</WhyHint>);
    const button = screen.getByRole("button", { name: "Varför?" });
    fireEvent.click(button);

    const region = screen.getByRole("region", { name: "Förklaring" });
    expect(button.getAttribute("aria-controls")).toBe(region.id);
    expect(region.id.length).toBeGreaterThan(0);
  });

  it("fungerar oberoende av andra förklaringar", () => {
    render(
      <>
        <WhyHint label="a">Förklaring A</WhyHint>
        <WhyHint label="b">Förklaring B</WhyHint>
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Varför a?" }));
    expect(screen.getByText("Förklaring A")).toBeTruthy();
    expect(screen.queryByText("Förklaring B")).toBeNull();

    const idA = screen.getByRole("region", { name: "Förklaring: a" }).id;
    fireEvent.click(screen.getByRole("button", { name: "Varför b?" }));
    const idB = screen.getByRole("region", { name: "Förklaring: b" }).id;
    expect(idA).not.toBe(idB);
  });

  it("har minst 44 px tryckyta i båda varianterna", () => {
    const { container } = render(
      <>
        <WhyHint appearance="chip">Chip</WhyHint>
        <WhyHint appearance="inline">Inline</WhyHint>
      </>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.className).toContain("min-h-11");
    });
  });
});
