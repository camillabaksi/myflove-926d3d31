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
  MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/flow-insights-modal", () => ({
  default: () => null,
}));
vi.mock("@/components/collapsible-section", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

describe("Mående: fem val ska vara läsbara också på smal skärm", () => {
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
