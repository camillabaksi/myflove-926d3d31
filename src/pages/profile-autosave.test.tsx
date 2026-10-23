import type { ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ setName: vi.fn(), toast: vi.fn(), addChild: vi.fn() }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/myflove/block", () => ({ MyFlovePageGrid: ({ children }: { children: ReactNode }) => <div>{children}</div>, MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/collapsible-section", () => ({ default: ({ children, description }: { children: ReactNode; description: ReactNode }) => <section>{description}{children}</section> }));
vi.mock("@/hooks/use-user-profile", () => ({ useUserProfile: () => ({ name: "Exempel", setName: state.setName }) }));
vi.mock("@/hooks/use-children", () => ({ CHILD_COLORS: ["sage"], useChildren: () => ({ userId: "test", children: [], addChild: state.addChild, updateChild: vi.fn(), deleteChild: vi.fn() }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ lang: "sv", setLang: vi.fn(), t: (s: string) => s }) }));
vi.mock("@/hooks/use-cycle", () => ({ useCycle: () => ({ cycle: { enabled: false }, setEnabled: vi.fn() }) }));
vi.mock("@/pages/life-profile", () => ({ LifeProfileSections: () => null }));
import ProfilePage from "./profile";

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => vi.useRealTimers());
describe("Profile name autosave without competing commands", () => {
  it("uses the same setter after 700 ms without falsely confirming cloud save", () => {
    render(<ProfilePage />);
    const input = screen.getByRole("textbox", { name: "Ditt namn" });
    fireEvent.change(input, { target: { value: "Nytt namn" } });
    act(() => vi.advanceTimersByTime(699));
    expect(state.setName).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(state.setName).toHaveBeenCalledExactlyOnceWith("Nytt namn");
    fireEvent.blur(input);
    expect(state.setName).toHaveBeenCalledOnce();
    expect(state.toast).not.toHaveBeenCalled();
    expect(screen.queryByTestId("profile-name-save")).toBeNull();
  });
  it("flushes a pending name on blur and preserves explicit child creation", () => {
    render(<ProfilePage />);
    const input = screen.getByRole("textbox", { name: "Ditt namn" });
    fireEvent.change(input, { target: { value: "Annat namn" } });
    fireEvent.blur(input);
    expect(state.setName).toHaveBeenCalledExactlyOnceWith("Annat namn");
    act(() => vi.advanceTimersByTime(700));
    expect(state.setName).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Lägg till barn" })).toBeVisible();
    expect(state.addChild).not.toHaveBeenCalled();
  });
});