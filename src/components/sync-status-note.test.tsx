import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudSyncStatus } from "@/lib/cloud-storage";
import type { SecureStatus } from "@/lib/secure-local";

const state = vi.hoisted(() => ({ status: "saved" as CloudSyncStatus, secure: "ready" as SecureStatus, retry: vi.fn() }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncStatus: () => state.status, flushCloudSync: state.retry }));
vi.mock("@/lib/secure-local", () => ({ getSecureStatus: () => state.secure, SECURE_STATUS_EVENT: "secure-test" }));
import { SyncStatusNote } from "./sync-status-note";

beforeEach(() => { vi.useFakeTimers(); state.status = "saved"; state.secure = "ready"; state.retry.mockClear(); });
afterEach(() => vi.useRealTimers());
describe("Cloud status stays truthful", () => {
  it("does not show an error or saved confirmation on an ordinary read", () => {
    render(<SyncStatusNote />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("retains the retry command on a failed sync and clears stale error during retry", () => {
    state.status = "error";
    const view = render(<SyncStatusNote />);
    expect(screen.getByRole("alert")).toBeVisible();
    const retry = screen.getByRole("button", { name: "Försök igen" });
    retry.focus();
    expect(retry).toHaveFocus();
    fireEvent.click(retry);
    expect(state.retry).toHaveBeenCalledOnce();
    state.status = "pending";
    view.rerender(<SyncStatusNote />);
    expect(screen.queryByRole("alert")).toBeNull();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("status")).toBeVisible();
    state.status = "saved";
    view.rerender(<SyncStatusNote />);
    expect(screen.getByRole("status")).toHaveTextContent("Sparat");
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("never claims device persistence when encryption is unavailable", () => {
    state.secure = "unavailable";
    state.status = "pending";
    render(<SyncStatusNote />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("status")).not.toHaveTextContent("Sparat på enheten");
    expect(screen.getByText(/inte spara energi/)).toBeVisible();
  });
});