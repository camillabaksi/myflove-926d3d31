import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrandLogo } from "./brand-logo";
import light from "@/assets/paceable-brand/paceable-horizontal-light.png.asset.json";
import dark from "@/assets/paceable-brand/paceable-horizontal-dark.png.asset.json";
import compactLight from "@/assets/paceable-brand/paceable-compact-light.png.asset.json";
import compactDark from "@/assets/paceable-brand/paceable-compact-dark.png.asset.json";

describe("Approved Paceable branding", () => {
  it("uses original horizontal sources and exact slogan without filters or cropping", () => {
    const { container } = render(<BrandLogo />);
    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("src", light.url);
    expect(images[1]).toHaveAttribute("src", dark.url);
    for (const image of images) {
      expect(image).toHaveAttribute("alt", "Paceable — Ditt liv, i din takt.");
      expect(image).toHaveClass("h-auto", "w-full");
      expect(image).not.toHaveAttribute("style");
    }
    expect(images[0]).toHaveClass("dark:hidden");
    expect(images[1]).toHaveClass("dark:block");
  });
  it("uses compact originals on small surfaces and preserves their individual proportions", () => {
    const { container } = render(<BrandLogo compact />);
    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("src", compactLight.url);
    expect(images[1]).toHaveAttribute("src", compactDark.url);
    expect(images[0]).toHaveAttribute("width", "1287");
    expect(images[1]).toHaveAttribute("width", "1277");
  });
});