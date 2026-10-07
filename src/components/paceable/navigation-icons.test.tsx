import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyPlaceIcon, ThoughtsIcon, TodayHorizonIcon } from "@/components/paceable/navigation-icons";
import { PaceableStones } from "@/components/paceable/paceable-stones";

describe("Paceable presentation", () => {
  it("renders the three primary navigation symbols", () => {
    const { container } = render(<><TodayHorizonIcon /><ThoughtsIcon /><MyPlaceIcon /></>);
    expect(container.querySelectorAll("svg")).toHaveLength(3);
  });

  it("keeps Min plats a single open contour at 24 px", () => {
    const { container } = render(<MyPlaceIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "24");
    expect(container.querySelector("svg")).toHaveAttribute("height", "24");
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "1.8");
    expect(container.querySelectorAll("path")).toHaveLength(1);
    expect(container.querySelector("path")?.getAttribute("d")).not.toMatch(/[zZ]/);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });

  it("keeps the three stones as one accessible identity with three reusable shapes", () => {
    const { container } = render(<PaceableStones />);
    expect(screen.getByRole("img", { name: "Tre mjuka Paceable-stenar" })).toBeInTheDocument();
    expect(container.querySelectorAll(".paceable-stone")).toHaveLength(3);
  });
});