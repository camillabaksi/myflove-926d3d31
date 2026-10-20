import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PacePageHeader } from "./page-header";

describe("shared page header action ownership", () => {
  it("runs the caller action once without writing preferences", () => {
    const open = vi.fn();
    const save = vi.spyOn(Storage.prototype, "setItem");
    render(<PacePageHeader icon={BellRing} title="Påminnelser" action={<Button onClick={open}>Lägg till</Button>} />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    save.mockRestore();
  });
});