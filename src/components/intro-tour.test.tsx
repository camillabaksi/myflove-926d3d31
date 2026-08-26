import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IntroTour from "@/components/intro-tour";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

describe("onboarding: intro + hoppa över", () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigate.mockClear();
  });

  it("visar introt för en ny användare", async () => {
    render(<IntroTour />);
    expect((await screen.findAllByText("Släpp det du bär på")).length).toBeGreaterThan(0);
  });

  it("'Hoppa över' går direkt till hemskärmen och visas inte igen", async () => {
    const { unmount } = render(<IntroTour />);
    const skips = await screen.findAllByRole("button", {
      name: /hoppa över intro och gå till startsidan/i,
    });
    fireEvent.click(skips[0]!);

    expect(navigate).toHaveBeenCalledWith({ to: "/hem" });
    expect(window.localStorage.getItem("myflove-intro-seen")).toBe("true");

    unmount();
    render(<IntroTour />);
    expect(screen.queryAllByText("Släpp det du bär på")).toHaveLength(0);
  });
});
