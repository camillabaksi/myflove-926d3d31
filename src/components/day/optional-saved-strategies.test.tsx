import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import OptionalSavedStrategies from "./optional-saved-strategies";
import { setCollapsed } from "@/lib/collapse-store";
import type { SavedStrategy } from "@/hooks/use-insight";

const model = vi.hoisted(() => ({
  saved: [] as SavedStrategy[],
}));
vi.mock("@/hooks/use-insight", () => ({
  useInsightStrategies: () => ({ saved: model.saved }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ..._props }: { children: ReactNode }) => <a href="/planera">{children}</a>,
}));

const strategy = (title: string, profileId?: string): SavedStrategy => ({
  id: title, strategyId: "time-visible", title, areaId: "tid",
  contexts: ["vardag"], friction: 2, minutes: 5, nudges: [], profileId, addedAt: 1,
});

beforeEach(() => {
  model.saved = [strategy("Gör tiden synlig"), strategy("Fiktivt demostöd", "demo-01")];
  setCollapsed(`${window.location.pathname}::optional-saved-strategies`, true, true);
});

describe("Optional strategy surfaces", () => {
  it("is absent if the user has saved no personal strategies", () => {
    model.saved = [];
    render(<OptionalSavedStrategies mode="today" />);
    expect(screen.queryByText("Mina frivilliga stöd")).toBeNull();
  });

  it("stays out of the day checklist and only offers a voluntary path to planning", () => {
    render(<OptionalSavedStrategies mode="today" />);
    const heading = screen.getByRole("button", { name: "Mina frivilliga stöd" });
    expect(heading).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(heading);
    expect(screen.getByText("Gör tiden synlig")).toBeInTheDocument();
    expect(screen.queryByText("Fiktivt demostöd")).toBeNull();
    expect(screen.getByRole("link", { name: /Använd ett stöd när jag planerar/ })).toHaveAttribute("href", "/planera");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("only updates a planning draft after explicit choice, never directly saves tasks", () => {
    const onSaved = vi.fn();
    function Harness() {
      const [text, setText] = useState("Handla");
      return <>
        <output data-testid="draft">{text}</output>
        <OptionalSavedStrategies mode="planning" draftText={text} onAddToDraft={(title) => {
          onSaved(title);
          setText((current) => `${current}\n${title}`);
        }} />
      </>;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Mina frivilliga stöd" }));
    expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ta med i utkastet" }));
    expect(onSaved).toHaveBeenCalledOnce();
    expect(onSaved).toHaveBeenCalledWith("Gör tiden synlig");
    expect(screen.getByTestId("draft").textContent).toBe("Handla\nGör tiden synlig");
    expect(screen.getByRole("button", { name: "Finns i utkastet" })).toBeDisabled();
  });
});
