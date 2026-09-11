import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFloveBlock } from "@/components/myflove/block";

/**
 * Minimera/maximera är en ren UI-preferens: innehållet ska försvinna och
 * komma tillbaka, och valet ska ligga kvar när sektionen monteras om.
 */

vi.mock("wouter", () => ({
  useLocation: () => ["/testsida", () => {}],
}));

describe("CollapsibleSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("visar innehållet som standard och kan minimeras och maximeras", () => {
    render(
      <CollapsibleSection title="Mitt batteri">
        <p>innehåll</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText("innehåll")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Mitt batteri/ }));
    expect(screen.queryByText("innehåll")).toBeNull();
    expect(screen.getByRole("button", { name: /Mitt batteri/ }).getAttribute("aria-expanded")).toBe(
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: /Mitt batteri/ }));
    expect(screen.getByText("innehåll")).toBeTruthy();
  });

  it("kommer ihåg minimerat läge när sektionen visas igen", () => {
    const view = render(
      <CollapsibleSection title="Mitt batteri">
        <p>innehåll</p>
      </CollapsibleSection>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Mitt batteri/ }));
    view.unmount();

    render(
      <CollapsibleSection title="Mitt batteri">
        <p>innehåll</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText("innehåll")).toBeNull();
  });

  it("gör vanliga MyFlove-block hopfällbara som standard och sparar valet", () => {
    const view = render(
      <MyFloveBlock title="Min plan">
        <p>planens innehåll</p>
      </MyFloveBlock>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Min plan/ }));
    expect(screen.queryByText("planens innehåll")).toBeNull();
    view.unmount();

    render(
      <MyFloveBlock title="Min plan">
        <p>planens innehåll</p>
      </MyFloveBlock>,
    );
    expect(screen.queryByText("planens innehåll")).toBeNull();
  });
});
