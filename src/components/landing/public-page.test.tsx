import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
const state = vi.hoisted(() => ({ path: "/om-oss" }));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => state.path,
  Link: ({ to, hash, children, ...rest }: { to: string; hash?: string; children: ReactNode }) => (
    <a href={`${to}${hash ? `#${hash}` : ""}`} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/auto-translate-provider", () => ({ LandingTranslateProvider: () => null }));
import { PublicPage } from "./public-page";
beforeEach(() => {
  window.localStorage.clear();
  state.path = "/om-oss";
});
it("links Features to the landing section from an inner page and marks the current page", () => {
  render(
    <PublicPage>
      <h1>Om Paceable</h1>
    </PublicPage>,
  );
  const nav = within(screen.getByRole("navigation", { name: "Huvudmeny" }));
  expect(nav.getByRole("link", { name: "Funktioner" })).toHaveAttribute("href", "/#funktioner");
  expect(nav.getByRole("link", { name: "Om oss" })).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("main")).toHaveLength(1);
  const footer = within(screen.getByRole("navigation", { name: "Mer om Paceable" }));
  expect(footer.getByRole("link", { name: "Hem" })).toHaveAttribute("href", "/");
  expect(footer.getByRole("link", { name: "Integritet" })).toHaveAttribute("href", "/integritet");
});
it("uses the same destinations on the mobile menu and guide page", () => {
  state.path = "/guide/adhd-planner-for-adults";
  render(
    <PublicPage>
      <h1>Guide</h1>
    </PublicPage>,
  );
  const mobile = within(screen.getByRole("navigation", { name: "Mobil meny" }));
  expect(mobile.getByRole("link", { name: "ADHD-guide" })).toHaveAttribute("aria-current", "page");
  expect(mobile.getByRole("link", { name: "Funktioner" })).toHaveAttribute("href", "/#funktioner");
});
it("retains the existing public language preference when moving between pages", async () => {
  const view = render(<PublicPage>Start</PublicPage>);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(window.localStorage.getItem("myflove-landing-language")).toBe("en");
  view.unmount();
  render(<PublicPage>Guide</PublicPage>);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true"),
  );
});
