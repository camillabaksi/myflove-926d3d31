import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FlowItemActions from "./flow-item-actions";

/**
 * Tre-prick-menyn ska öppna vid ett riktigt tryck – aldrig när man börjar
 * skrolla med fingret på den. Radix-menyer öppnar normalt vid pek ned, så
 * detta låser in beteendet.
 */
describe("Skroll-säker tre-prick-meny", () => {
  it("öppnar vid tryck men inte vid pek ned (skrollstart)", () => {
    render(<FlowItemActions itemId="task-1" compact />);
    const trigger = screen.getByRole("button", { name: "Fler val" });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();

    // Pek ned är ofta början på en skroll – menyn ska inte öppna.
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0 });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();

    // Ett riktigt tryck öppnar menyn.
    fireEvent.click(trigger, { detail: 1 });
    expect(screen.getByRole("menuitem", { name: "Ändra" })).toBeInTheDocument();
  });

  it("öppnar inte när fingret flyttat sig innan klicket", () => {
    render(<FlowItemActions itemId="task-1" compact />);
    const trigger = screen.getByRole("button", { name: "Fler val" });
    fireEvent.touchStart(trigger, { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchMove(trigger, { touches: [{ clientX: 10, clientY: 40 }] });
    fireEvent.click(trigger, { detail: 1 });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();
  });
});
