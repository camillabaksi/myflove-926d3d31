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

  it("keeps a long title, help and another action independently usable at mobile/large text sizes", () => {
    const save = vi.fn();
    render(
      <CollapsibleSection
        title="Aktiviteter och återhämtning under hela eftermiddagen"
        help="Här kan du se mer om dagens aktiviteter."
        actions={<button type="button" onClick={save}>Spara inställningar</button>}
      >
        <p>Detaljerna till min dag</p>
      </CollapsibleSection>,
    );
    const title = screen.getByText("Aktiviteter och återhämtning under hela eftermiddagen");
    expect(title).toHaveClass("break-words");
    const collapse = screen.getByRole("button", { name: /^Aktiviteter och återhämtning under hela eftermiddagen$/ });
    expect(collapse).toHaveClass("min-h-11");
    expect(collapse.className).toContain("min-w-[min(100%,10rem)]");
    expect(collapse.closest(".pace-collapse-header")).toHaveClass("flex-wrap");

    const help = screen.getByRole("button", { name: /Vad är Aktiviteter och återhämtning/ });
    expect(help).toHaveClass("min-h-11", "min-w-11");
    const symbol = help.querySelector('span[aria-hidden="true"]');
    expect(symbol).toHaveClass("h-6", "w-6");

    fireEvent.click(screen.getByRole("button", { name: "Spara inställningar" }));
    expect(save).toHaveBeenCalledOnce();
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(collapse);
    expect(screen.queryByText("Detaljerna till min dag")).not.toBeInTheDocument();
    expect(help).toBeInTheDocument();
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

  it("öppnar en länkad sektion även när användaren tidigare fällt ihop den", () => {
    const view = render(
      <CollapsibleSection title="Doser" id="Medicin" defaultCollapsed>
        <p>medicinens innehåll</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText("medicinens innehåll")).toBeNull();
    view.rerender(
      <CollapsibleSection title="Doser" id="Medicin" defaultCollapsed revealToken="/testsida#Medicin">
        <p>medicinens innehåll</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("medicinens innehåll")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Doser/ }));
    expect(screen.queryByText("medicinens innehåll")).toBeNull();
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
