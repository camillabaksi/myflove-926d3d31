import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import QuickAddSheet from "./quick-add-sheet";
import { PRIMARY_ADD_CHOICES, CALENDAR_ADD_KIND, TODAY_ADD_KIND } from "@/lib/add-entry-choices";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search: _search, ...rest }: { children: ReactNode; to: string; search?: unknown; onClick?: () => void }) =>
    <a href={to} {...rest}>{children}</a>,
}));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (value: string) => value }) }));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ addTask: vi.fn() }),
  useReminders: () => ({ addReminder: vi.fn() }),
}));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ add: vi.fn() }) }));
vi.mock("@/hooks/use-capacity-mode", () => ({ useCapacityMode: () => ({ mode: "normal" }) }));
vi.mock("@/hooks/use-flow-items", () => ({ useFlowItems: () => ({ todayOpen: [] }) }));
vi.mock("@/lib/life-areas", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/life-areas")>()),
  useActiveArea: () => ({ activeArea: "alla" }),
}));

describe("Consistent simple add from Today and Calendar", () => {
  it("maps the same three understandable choices into each existing storage workflow", () => {
    expect(PRIMARY_ADD_CHOICES.map(choice => choice.label)).toEqual(["Att göra", "Händelse", "Påminnelse"]);
    expect(PRIMARY_ADD_CHOICES.map(choice => TODAY_ADD_KIND[choice.id])).toEqual(["aktivitet", "handelse", "paminnelse"]);
    expect(PRIMARY_ADD_CHOICES.map(choice => CALENDAR_ADD_KIND[choice.id])).toEqual(["task", "activity", "reminder"]);
  });

  it("keeps Today compact until requested, with one direct route for planning several", () => {
    const close = vi.fn();
    render(<QuickAddSheet open onOpenChange={close} />);
    expect(screen.getByRole("textbox", { name: "Vad vill du lägga till?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fler val · Att göra/ })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: /Fler val · Att göra/ }));
    for (const choice of PRIMARY_ADD_CHOICES) expect(screen.getByText(choice.label)).toBeInTheDocument();
    expect(screen.getByText("Bara en tanke")).toBeInTheDocument();
    const multiple = screen.getByRole("link", { name: "Planera flera aktiviteter i stället" });
    expect(multiple).toHaveAttribute("href", "/planera");
    fireEvent.click(multiple);
    expect(close).toHaveBeenCalledWith(false);
  });
});
