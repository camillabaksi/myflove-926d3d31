import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text }) }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/simple-checkin", () => ({
  default: ({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) => (
    <>
      <button onClick={onSaved}>Bekräfta sparning</button>
      <button onClick={onCancel}>Avbryt incheckning</button>
    </>
  ),
}));
import { TodayCapacity } from "@/components/day/today-capacity";

describe("incheckning från startsidan", () => {
  it("behåller direktknappen efter att första incheckningen har gett dagens kapacitet", () => {
    const { rerender } = render(<TodayCapacity percent={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Logga energi & mående");
    fireEvent.click(screen.getByRole("button", { name: "Bekräfta sparning" }));
    rerender(<TodayCapacity percent={60} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Avbryt incheckning" }));
    expect(screen.getByRole("button", { name: "Logga energi & mående" })).toBeVisible();
  });

  it.each([0, 100])("gör även dagens kapacitet %s möjlig att logga igen", (percent) => {
    render(<TodayCapacity percent={percent} />);
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
