import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlowMascot, FlowSays, FLOW_MASCOT_SRC } from "./flow-mascot";

/**
 * Den borttagna maskotbilden ska varken lämna bild eller tom layoutruta.
 */
describe("FlowMascot", () => {
  it("visar ingen bild eller layoutruta även med bump", () => {
    const { container } = render(<FlowMascot size="xs" bump alt="Flow" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByAltText("Flow")).toBeNull();
    expect(FLOW_MASCOT_SRC).toBeTruthy();
  });

  it("visar ingen bild eller layoutruta utan bump", () => {
    const { container } = render(<FlowMascot size="sm" alt="Flow utan bump" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByAltText("Flow utan bump")).toBeNull();
  });
  it("behåller meddelanden och handlingar utan bildkolumn", () => {
    const { container } = render(<FlowSays>Här finns stöd <a href="/assistant">Prata med Pace</a></FlowSays>);
    expect(screen.getByText(/Här finns stöd/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Prata med Pace" })).toHaveAttribute("href", "/assistant");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[class*="grid-cols"]')).toBeNull();
  });
});
