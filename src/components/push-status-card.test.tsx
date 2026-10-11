// @vitest-environment-options {"url":"https://paceable.test/paminnelser"}
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  current: null as null | { endpoint: string; p256dh: string; auth: string },
  saved: [] as string[],
  subscribe: vi.fn(),
  test: vi.fn(),
  toast: vi.fn(),
  preview: vi.fn(),
  changed: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/native-caps", () => ({ isNativeShell: () => false }));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast }));
vi.mock("@/lib/push-notifications", () => ({ playAlarmPreview: mocks.preview }));
vi.mock("@/lib/push.functions", () => ({
  subscribeToPush: mocks.subscribe,
  unsubscribeFromPush: vi.fn(),
  sendTestPush: mocks.test,
  getPushStatus: async () => ({ endpoints: mocks.saved }),
}));
vi.mock("@/lib/push-client", () => ({
  pushSupported: () => true,
  getCurrentSubscription: async () => mocks.current,
  subscribeUserToPush: async () => {
    mocks.current = { endpoint: "https://push.test/android", p256dh: "key", auth: "auth" };
    return mocks.current;
  },
  unsubscribeCurrent: vi.fn(),
  PUSH_SUBSCRIPTION_EVENT: "test-push-changed",
  notifyPushSubscriptionChanged: () => {
    mocks.changed();
    window.dispatchEvent(new Event("test-push-changed"));
  },
}));

import { PushStatusCard } from "./push-status-card";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("Notification", { permission: "granted" });
  mocks.current = null;
  mocks.saved = [];
  mocks.subscribe.mockImplementation(async ({ data }: { data: { endpoint: string } }) => {
    mocks.saved.push(data.endpoint);
    return { ok: true };
  });
  mocks.test.mockResolvedValue({ sent: 1 });
});
afterEach(() => vi.unstubAllGlobals());

describe("aktivering av bakgrundsnotiser", () => {
  it("registrerar enheten på servern även om behörigheten redan är beviljad", async () => {
    let finish!: () => void;
    mocks.subscribe.mockImplementation(
      ({ data }: { data: { endpoint: string } }) =>
        new Promise<void>((resolve) => {
          finish = () => {
            mocks.saved.push(data.endpoint);
            resolve();
          };
        }),
    );
    render(<PushStatusCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Aktivera notiser" }));
    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledOnce());
    expect(mocks.changed).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Stäng av notiser" })).not.toBeInTheDocument();
    await act(async () => finish());
    expect(await screen.findByRole("button", { name: "Stäng av notiser" })).toBeEnabled();
    expect(mocks.subscribe).toHaveBeenCalledWith({
      data: expect.objectContaining({
        endpoint: "https://push.test/android",
        p256dh: "key",
        auth: "auth",
      }),
    });
    expect(mocks.changed).toHaveBeenCalledOnce();
    expect(mocks.test).not.toHaveBeenCalled();
  });

  it("visar inte klart när serverregistreringen misslyckas", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.subscribe.mockRejectedValue(new Error("Offline"));
      render(<PushStatusCard />);
      fireEvent.click(await screen.findByRole("button", { name: "Aktivera notiser" }));
      await waitFor(() =>
        expect(mocks.toast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Det gick inte just nu" }),
        ),
      );
      expect(mocks.changed).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Testa notis" })).toBeDisabled();
    } finally {
      log.mockRestore();
    }
  });

  it("skiljer ett lokalt ljudtest från ett uttryckligt push-test", async () => {
    render(<PushStatusCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Testa appens ljud" }));
    expect(mocks.preview).toHaveBeenCalledOnce();
    expect(mocks.test).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aktivera notiser" }));
    await screen.findByRole("button", { name: "Stäng av notiser" });
    fireEvent.click(screen.getByRole("button", { name: "Testa notis" }));
    await waitFor(() => expect(mocks.test).toHaveBeenCalledOnce());
    expect(mocks.preview).toHaveBeenCalledOnce();
  });
});
