import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AnchorHTMLAttributes } from "react";
vi.mock("wouter", () => ({
  useLocation: () => ["/design-test", () => {}],
  Link: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@/hooks/use-smart-back", () => ({ useSmartBack: () => vi.fn() }));
import { MyFloveBlock } from "./block";
import { ExpandableBlock } from "./expandable-block";
import { Calendar } from "lucide-react";

describe("Refreshed block presentation retains existing behavior", () => {
  it("keeps actions independent, shows full labels, and retains collapsed status and footer", () => {
    const action = vi.fn();
    render(
      <MyFloveBlock
        title="Ett längre namn som behöver kunna visas på mobil"
        icon={Calendar}
        defaultCollapsed
        collapseId="presentation::label"
        status="Två saker kvar"
        action={<button onClick={action}>Spara separat</button>}
        footer={<button>Fortsätt</button>}
      >
        <input aria-label="Befintlig inmatning" defaultValue="Mitt utkast" />
      </MyFloveBlock>,
    );
    const title = screen.getByRole("heading");
    expect(title.closest("section")).toHaveAttribute("data-pace-block", "true");
    expect(screen.getByText("Två saker kvar")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Spara separat" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ett längre namn/ }));
    expect(screen.getByRole("textbox")).toHaveValue("Mitt utkast");
    expect(screen.getByRole("button", { name: "Fortsätt" })).toBeVisible();
  });
  it("keeps an existing collapse preference across a remount", () => {
    const view = render(
      <MyFloveBlock title="Bestående block" collapseId="presentation::persist">
        <p>Innehåll</p>
      </MyFloveBlock>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bestående block" }));
    view.unmount();
    render(
      <MyFloveBlock title="Bestående block" collapseId="presentation::persist">
        <p>Innehåll</p>
      </MyFloveBlock>,
    );
    expect(screen.getByRole("button", { name: "Bestående block" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  it("retains navigation for link blocks and expansion for inline blocks", () => {
    render(
      <>
        <ExpandableBlock href="/studier" title="Öppna studier" />
        <ExpandableBlock title="Detaljer">
          <p>Visa befintligt innehåll</p>
        </ExpandableBlock>
      </>,
    );
    expect(screen.getByRole("link", { name: "Öppna Öppna studier" })).toHaveAttribute(
      "href",
      "/studier",
    );
    fireEvent.click(screen.getByRole("button", { name: "Öppna Detaljer" }));
    expect(screen.getByText("Visa befintligt innehåll")).toBeVisible();
    expect(screen.getByRole("button", { name: "Minimera Detaljer" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
