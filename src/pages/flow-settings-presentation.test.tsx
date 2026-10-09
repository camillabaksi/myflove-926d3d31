import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
const mocks = vi.hoisted(() => ({ update: vi.fn(), togglePriority: vi.fn(), reset: vi.fn() }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/flow/flow-character", () => ({ FlowCharacter: () => null }));
vi.mock("wouter", () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/hooks/use-flow-settings", () => ({ useFlowSettings: () => ({ settings: { enabled: true, level: "diskret", learning: false, quietFrom: "08:00", quietTo: "21:00", leadMinutes: 30, priorities: {} }, ...mocks }) }));
import FlowSettingsPage from "./flow-settings";

describe("Pace settings presentation preserves existing actions", () => {
  it("keeps level and time changes caller-owned with unchanged field IDs", () => {
    render(<FlowSettingsPage />);
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("pace-page-title");
    expect(screen.getByRole("button", { name: "Diskret" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Tyst" }));
    expect(mocks.update).toHaveBeenCalledWith({ level: "tyst" });
    const from = screen.getByLabelText("Tidigast");
    expect(from.id).toBe("flow-from");
    expect(from.className).toContain("pace-ds-control");
    fireEvent.change(from, { target: { value: "09:00" } });
    expect(mocks.update).toHaveBeenCalledWith({ quietFrom: "09:00" });
  });
  it("keeps switch, reset and destination behavior", () => {
    render(<FlowSettingsPage />);
    fireEvent.click(screen.getByLabelText("Visa Pace i appen"));
    expect(mocks.update).toHaveBeenCalledWith({ enabled: false });
    fireEvent.click(screen.getByRole("button", { name: "Återställ till standard" }));
    expect(mocks.reset).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Se Pace live" }).getAttribute("href")).toBe("/flow");
    expect(screen.getByLabelText("Förvarning i minuter").getAttribute("aria-valuemin")).toBe("5");
    expect(screen.getByLabelText("Förvarning i minuter").getAttribute("aria-valuemax")).toBe("90");
  });
});