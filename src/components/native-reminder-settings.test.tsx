import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  status: { supported: true, enabled: false, permission: "prompt", exact: false, count: 0 },
  enable: vi.fn(),
  disable: vi.fn(),
  exact: vi.fn(),
  test: vi.fn(),
  toast: vi.fn(),
  preview: vi.fn(),
}));
vi.mock("@/lib/native-reminders", () => ({
  getNativeReminderStatus: async () => ({ ...mock.status }),
  enableNativeReminders: mock.enable,
  disableNativeReminders: mock.disable,
  requestNativeExactTimes: mock.exact,
  testNativeReminder: mock.test,
  NATIVE_REMINDERS_EVENT: "native-changed",
}));
vi.mock("@/lib/push-notifications", () => ({ playAlarmPreview: mock.preview }));
vi.mock("@/hooks/use-toast", () => ({ toast: mock.toast }));
import { NativeReminderSettings } from "./native-reminder-settings";
beforeEach(() => {
  vi.clearAllMocks();
  mock.status = { supported: true, enabled: false, permission: "prompt", exact: false, count: 0 };
  mock.enable.mockImplementation(async () => {
    mock.status.enabled = true;
    mock.status.permission = "granted";
  });
  mock.exact.mockImplementation(async () => {
    mock.status.exact = true;
  });
  mock.test.mockResolvedValue(true);
});
it("keeps automatic checks separate from explicit permission/exact-time/test taps", async () => {
  render(<NativeReminderSettings />);
  fireEvent.click(await screen.findByRole("button", { name: "Aktivera notiser" }));
  expect(mock.exact).not.toHaveBeenCalled();
  expect(mock.test).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Tillåt exakta tider" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Testa notis" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Testa notis" }));
  await waitFor(() =>
    expect(mock.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Testnotis om 10 sekunder" }),
    ),
  );
  expect(mock.preview).not.toHaveBeenCalled();
});
it("asks old app versions to update, without claiming background support", async () => {
  mock.status.supported = false;
  render(<NativeReminderSettings />);
  expect(await screen.findByText("Uppdatera Paceable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Aktivera notiser" })).not.toBeInTheDocument();
});
it("explains denied phone permission and does not offer a test", async () => {
  mock.status.permission = "denied";
  render(<NativeReminderSettings />);
  expect(await screen.findByText(/Tillåt notiser för Paceable/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Testa notis" })).toBeDisabled();
  expect(mock.enable).not.toHaveBeenCalled();
});
