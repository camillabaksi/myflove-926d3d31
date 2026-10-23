import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoodContent } from "./mood";

const state = vi.hoisted(() => ({ addMood: vi.fn(), toast: vi.fn() }));

vi.mock("@/hooks/use-data", () => ({
  useMoods: () => ({ moods: [], addMood: state.addMood }),
}));
vi.mock("@/hooks/use-language", () => ({
  useLang: () => ({ locale: "sv-SE", t: (label: string) => label }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: state.toast }),
}));
vi.mock("@/components/myflove/block", () => ({
  MyFlovePageGrid: ({ children }: { children: ReactNode }) => <main>{children}</main>,
  MyFloveWide: ({ children, span }: { children: ReactNode; span?: "full" | "wide" }) => <div data-testid="mood-wide" data-span={span ?? "full"}>{children}</div>,
}));
vi.mock("@/components/flow-insights-modal", () => ({
  default: () => null,
}));
vi.mock("@/components/collapsible-section", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

describe("Mående: fem val ska vara läsbara också på smal skärm", () => {
  it("keeps the Mood form and pattern action wide in the desktop page grid", () => {
    const { container } = render(<MoodContent showHeader={false} />);
    const choice = screen.getByRole("button", { name: "Okej" });
    const insights = screen.getByRole("button", { name: "Se mina mönster" });
    expect(choice.closest('[data-testid="mood-wide"]')).toHaveAttribute("data-span", "wide");
    expect(insights.closest('[data-testid="mood-wide"]')).toHaveAttribute("data-span", "wide");
    const form = choice.closest(".pace-card-surface");
    expect(form).toHaveClass("min-w-0", "p-4", "sm:p-6");
    expect(container.querySelectorAll('[data-testid="mood-wide"][data-span="wide"]')).toHaveLength(2);
  });

  it("keeps the read-only history path full-width without offering competing check-in controls", () => {
    render(<MoodContent showHeader={false} readOnly />);
    expect(screen.getByTestId("mood-history-readonly").closest('[data-testid="mood-wide"]'))
      .toHaveAttribute("data-span", "full");
    expect(screen.queryByRole("button", { name: "Spara mående" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Se mina mönster" })).not.toBeInTheDocument();
  });

  it("uses the approved plum icon when confirming a logged mood", () => {
    render(<MoodContent showHeader={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Okej" }));
    fireEvent.click(screen.getByRole("button", { name: "Spara mående" }));
    const confirmed = screen.getByRole("heading", { name: "Tack för att du checkade in" });
    expect(confirmed.parentElement?.querySelector("svg.text-primary")).not.toBeNull();
    expect(confirmed.parentElement?.textContent).not.toContain("💚");
    expect(state.addMood).toHaveBeenCalledWith(3, "");
  });

  it("allows choices to wrap rather than compressing all five into one row", () => {
    const { container } = render(<MoodContent showHeader={false} />);
    const buttons = ["Tungt", "Låg", "Okej", "Bra", "Toppen"].map(label =>
      screen.getByRole("button", { name: label }),
    );
    expect(buttons).toHaveLength(5);
    const choiceRow = buttons[0].parentElement;
    expect(choiceRow).toHaveClass("flex-wrap");
    expect(choiceRow).toHaveClass("justify-center");
    expect(choiceRow).toHaveClass("gap-2");
    buttons.forEach(button => {
      expect(button).toHaveClass("min-h-11");
      expect(button).toHaveClass("min-w-11");
      expect(button.querySelector("span:last-child")).toHaveClass("[overflow-wrap:anywhere]");
    });
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(0);
  });

  it("highlights the selected state without scale enlargement that may overlap neighbors", () => {
    render(<MoodContent showHeader={false} />);
    const selected = screen.getByRole("button", { name: "Okej" });
    fireEvent.click(selected);
    expect(selected).toHaveAttribute("aria-pressed", "true");
    expect(selected).toHaveClass("ring-2");
    expect(selected).not.toHaveClass("scale-110");
    expect(screen.getByRole("button", { name: "Spara mående" })).toBeVisible();
    expect(state.addMood).not.toHaveBeenCalled();
  });
});
