import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FlowItemActions from "./flow-item-actions";

/**
 * Tre-prick-menyn ska öppna vid ett riktigt tryck – aldrig när man börjar
 * skrolla med fingret på den. Radix-menyer öppnar normalt vid pek ned, så
 * detta låser in beteendet. Öppningen sker vid pek upp eftersom riktiga
 * tappar ger klick med detail 0 när pek ned avbrutits.
 */
describe("Skroll-säker tre-prick-meny", () => {
  it("öppnar vid tryck men inte vid pek ned (skrollstart)", () => {
    render(<FlowItemActions itemId="task-1" compact />);
    const trigger = screen.getByRole("button", { name: "Fler val" });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();

    // Pek ned är ofta början på en skroll – menyn ska inte öppna.
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();

    // Pek upp utan rörelse är ett riktigt tryck och öppnar menyn.
    fireEvent.pointerUp(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    expect(screen.getByRole("menuitem", { name: "Ändra" })).toBeInTheDocument();
  });

  it("öppnar inte när fingret flyttat sig innan pek upp", () => {
    render(<FlowItemActions itemId="task-1" compact />);
    const trigger = screen.getByRole("button", { name: "Fler val" });
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(trigger, { pointerType: "touch", clientX: 10, clientY: 40 });
    fireEvent.pointerUp(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 40 });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();
  });

  it("öppnar inte när pekad upp skett långt från pek ned", () => {
    render(<FlowItemActions itemId="task-1" compact />);
    const trigger = screen.getByRole("button", { name: "Fler val" });
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(trigger, { pointerType: "touch", button: 0, clientX: 10, clientY: 120 });
    expect(screen.queryByRole("menuitem", { name: "Ändra" })).not.toBeInTheDocument();
  });
});
