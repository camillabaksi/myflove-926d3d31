import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_QUIET_STATE,
  pauseRemindersFor,
  QUIET_MODE_KEY,
  setQuietMode,
} from "@/lib/quiet-mode";

const mocks = vi.hoisted(() => ({ set: vi.fn(), sync: vi.fn(), user: vi.fn(), active: true }));
vi.mock("@/lib/cloud-storage", () => ({
  ACCOUNT_BOUND_EVENT: "test-account-bound",
  useCloudSyncedStorage: (_key: string, initial: unknown) => [initial, mocks.set],
  requestSync: mocks.sync,
  getSyncUser: mocks.user,
}));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: () => mocks.active }));
import { useQuietModeSync } from "./use-quiet-mode-sync";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.active = true;
  mocks.user.mockResolvedValue({ id: "owner-a" });
  mocks.sync.mockResolvedValue(undefined);
});

describe("kontosynk av paus från alla appvyer", () => {
  it("sparar en paus omedelbart till samma molnvärde som nattinställningarna", async () => {
    renderHook(() => useQuietModeSync());
    await waitFor(() => expect(mocks.sync).toHaveBeenCalled());
    mocks.sync.mockClear();
    act(() => {
      pauseRemindersFor(30);
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ pausedUntil: expect.any(Number), timeZone: expect.any(String) }),
    );
    expect(mocks.sync).toHaveBeenCalledWith(QUIET_MODE_KEY);
    expect(mocks.set.mock.calls[0][0].pausedUntil).toBeGreaterThan(Date.now());
  });

  it("läser det befintliga kontovärdet innan tidszon läggs till", async () => {
    const stored = { ...DEFAULT_QUIET_STATE, scheduleEnabled: true, scheduleStart: "21:00" };
    mocks.sync.mockImplementation(async () => {
      localStorage.setItem(QUIET_MODE_KEY, JSON.stringify(stored));
    });
    renderHook(() => useQuietModeSync());
    await waitFor(() =>
      expect(mocks.set).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduleEnabled: true,
          scheduleStart: "21:00",
          timeZone: expect.any(String),
        }),
      ),
    );
  });

  it("skriver inga defaults om den första molnläsningen inte gav något lokalt värde", async () => {
    renderHook(() => useQuietModeSync());
    await waitFor(() => expect(mocks.sync).toHaveBeenCalled());
    expect(mocks.set).not.toHaveBeenCalled();
    expect(localStorage.getItem(QUIET_MODE_KEY)).toBeNull();
  });

  it("väntar på kontobindning och bevarar nattinställningarna", async () => {
    mocks.user.mockResolvedValue(null);
    localStorage.setItem(
      QUIET_MODE_KEY,
      JSON.stringify({ ...DEFAULT_QUIET_STATE, scheduleEnabled: true }),
    );
    renderHook(() => useQuietModeSync());
    await waitFor(() => expect(mocks.user).toHaveBeenCalled());
    expect(mocks.set).not.toHaveBeenCalled();
    mocks.user.mockResolvedValue({ id: "owner-a" });
    act(() => window.dispatchEvent(new Event("test-account-bound")));
    await waitFor(() =>
      expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ scheduleEnabled: true })),
    );
  });

  it("avstår från zonuppdatering när kontot bytts under läsningen", async () => {
    localStorage.setItem(QUIET_MODE_KEY, JSON.stringify(DEFAULT_QUIET_STATE));
    mocks.sync.mockImplementation(async () => {
      mocks.active = false;
    });
    renderHook(() => useQuietModeSync());
    await waitFor(() => expect(mocks.sync).toHaveBeenCalled());
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("slutar synka när den inloggade appen avmonteras", async () => {
    const { unmount } = renderHook(() => useQuietModeSync());
    await waitFor(() => expect(mocks.sync).toHaveBeenCalled());
    unmount();
    mocks.set.mockClear();
    act(() => {
      setQuietMode({ pausedUntil: 0 });
    });
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
