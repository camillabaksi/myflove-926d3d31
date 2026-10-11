import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
vi.mock("wouter", () => ({ Link: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
vi.mock("@/components/myflove/block", () => ({ MyFloveBlock: (props: { title: string; collapseId?: string }) => <div data-testid="block" data-collapse={props.collapseId}>{props.title}</div> }));
import { PacePage, PaceContent, PaceField, PaceInput, PaceChoice, PaceHeading, PacePageTitle, PaceStatus, PaceBlock, PaceInfoBlock } from "./design-system";
import DesignSystemReference from "./design-system-reference";

describe("Pace presentation system", () => {
  it("provides a page title without restyling sibling forms", () => {
    render(<div><PacePageTitle id="orientation">Inställningar</PacePageTitle><input aria-label="Unchanged field" /></div>);
    const title = screen.getByRole("heading", { level: 1, name: "Inställningar" });
    expect(title.id).toBe("orientation");
    expect(title.className).toContain("pace-editorial-role");
    expect(title.className).toContain("pace-page-title");
    expect(screen.getByLabelText("Unchanged field").closest("[data-pace-design]")).toBeNull();
  });
  it("opts in and reserves editorial typography for explicit headings", () => {
    render(<PacePage><PaceHeading>Function</PaceHeading><PaceHeading editorial>Orientation</PaceHeading></PacePage>);
    expect(screen.getByText("Function").closest("[data-pace-design]")).toBeTruthy();
    expect(screen.getByText("Function").className).not.toContain("pace-editorial-role");
    expect(screen.getByText("Orientation").className).toContain("pace-editorial-role");
  });
  it("offers semantic content widths and information blocks without owning behavior", () => {
    render(<PacePage><PaceContent width="reading"><PaceInfoBlock>Helpful context</PaceInfoBlock></PaceContent></PacePage>);
    expect(screen.getByText("Helpful context").parentElement?.className).toContain("pace-ds-content-reading");
    expect(screen.getByText("Helpful context").className).toContain("pace-ds-info");
  });
  it("connects labels/help/errors and preserves handlers", () => {
    const change = vi.fn();
    render(<PaceField label="Namn" help="Eget namn" error="Skriv något" required><PaceInput id="name" aria-describedby="existing" onChange={change} /></PaceField>);
    const input = screen.getByLabelText(/Namn/);
    expect(input.getAttribute("aria-describedby")).toBe("existing name-help name-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("required")).toBe(true);
    fireEvent.change(input, { target: { value: "Camilla" } });
    expect(change).toHaveBeenCalledTimes(1);
  });
  it("keeps choices caller-controlled", () => {
    const click = vi.fn();
    render(<PaceChoice selected={false} onClick={click}>Hemma</PaceChoice>);
    const choice = screen.getByRole("button", { name: "Hemma" });
    fireEvent.click(choice);
    expect(click).toHaveBeenCalledTimes(1);
    expect(choice.getAttribute("aria-pressed")).toBe("false");
  });
  it("retains collapse identifiers and accessible error announcements", () => {
    render(<><PaceBlock title="Rutin" collapseId="original-key" /><PaceStatus state="error">Kunde inte spara</PaceStatus></>);
    expect(screen.getByTestId("block").getAttribute("data-collapse")).toBe("original-key");
    expect(screen.getByRole("alert").textContent).toBe("Kunde inte spara");
  });
  it("validates isolated examples without writing storage", () => {
    const store = vi.spyOn(Storage.prototype, "setItem");
    render(<DesignSystemReference />);
    fireEvent.click(screen.getByRole("button", { name: "Spara exempel" }));
    expect(screen.getByText("Skriv ett namn innan du fortsätter.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Vad vill du kalla planen/), { target: { value: "Långt osparat namn" } });
    fireEvent.click(screen.getByRole("button", { name: "Spara exempel" }));
    expect(screen.getByText("Exemplet är klart; inget har sparats på ditt konto.")).toBeTruthy();
    expect(store).not.toHaveBeenCalled();
    store.mockRestore();
  });
});
