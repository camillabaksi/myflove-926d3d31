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
  Link: ({ children, search, to }: { children: ReactNode; search?: Record<string, string>; to: string }) => (
    <a href={to} data-search={JSON.stringify(search)}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: window.location.pathname } }),
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
    expect(screen.queryByText("Mina stöd")).toBeNull();
  });

  it("stays out of the day checklist and only offers a voluntary path to planning", () => {
    render(<OptionalSavedStrategies mode="today" />);
    const heading = screen.getByRole("button", { name: "Mina stöd" });
    expect(heading).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(heading);
    expect(screen.getByText("Gör tiden synlig")).toBeInTheDocument();
    expect(screen.queryByText("Fiktivt demostöd")).toBeNull();
    expect(screen.getByRole("link", { name: /Använd ett stöd när jag planerar/ })).toHaveAttribute("href", "/planera");
    expect(screen.getByRole("link", { name: /Använd ett stöd när jag planerar/ }))
      .toHaveAttribute("data-search", JSON.stringify({ audience: "me", period: "today", supports: "1" }));
    expect(screen.getByRole("link", { name: /Hantera mina stöd/ })).toHaveAttribute("href", "/insight");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("reveals the list from an explicit navigation hint without selecting or saving an activity", () => {
    render(<OptionalSavedStrategies mode="planning" revealToken="from-today" draftText="" onAddToDraft={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Mina stöd" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Gör tiden synlig")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ta med i utkastet" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Hantera mina stöd/ })).toHaveAttribute("href", "/insight");
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
    fireEvent.click(screen.getByRole("button", { name: "Mina stöd" }));
    expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ta med i utkastet" }));
    expect(onSaved).toHaveBeenCalledOnce();
    expect(onSaved).toHaveBeenCalledWith("Gör tiden synlig");
    expect(screen.getByTestId("draft").textContent).toBe("Handla\nGör tiden synlig");
    expect(screen.getByRole("button", { name: "Finns i utkastet" })).toBeDisabled();
  });
});
