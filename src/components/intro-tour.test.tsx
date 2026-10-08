import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IntroTour from "@/components/intro-tour";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

describe("onboarding: en enkel första handling", () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigate.mockClear();
  });

  it("visar den enkla frågan för en ny användare", async () => {
    render(<IntroTour />);
    expect((await screen.findAllByText("Vad snurrar i huvudet?")).length).toBeGreaterThan(0);
  });

  it("'Hoppa över' går direkt till hemskärmen och visas inte igen", async () => {
    const { unmount } = render(<IntroTour />);
    const skips = await screen.findAllByRole("button", { name: /hoppa över intro/i });
    fireEvent.click(skips[0]);

    expect(navigate).toHaveBeenCalledWith({ to: "/idag" });
    expect(window.localStorage.getItem("myflove-intro-seen")).toBe("true");

    unmount();
    render(<IntroTour />);
    expect(screen.queryAllByText("Vad snurrar i huvudet?")).toHaveLength(0);
  });

  it("öppnar QuickFlow som första handling", async () => {
    const openQuickflow = vi.fn();
    window.addEventListener("myflove:quickflow", openQuickflow, { once: true });
    render(<IntroTour />);

    fireEvent.click(await screen.findByRole("button", { name: /skriv en tanke/i }));

    await vi.waitFor(() => expect(openQuickflow).toHaveBeenCalledOnce());
    expect(window.localStorage.getItem("myflove-intro-seen")).toBe("true");
  });
});
