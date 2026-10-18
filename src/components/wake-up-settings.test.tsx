import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), toast: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/push.functions", () => ({
  getPushPreferences: fixture.load,
  savePushPreferences: fixture.save,
}));
vi.mock("@/hooks/use-toast", () => ({ toast: fixture.toast }));
import WakeUpSettings from "./wake-up-settings";

beforeEach(() => {
  vi.clearAllMocks();
  fixture.load.mockResolvedValue({
    wake_enabled: false,
    wake_time: "07:00",
    wake_interval_min: 8,
    wake_max_followups: 4,
  });
  fixture.save.mockResolvedValue({});
});
async function open() {
  render(<WakeUpSettings />);
  await screen.findByLabelText("Puff igen efter (min)");
}

describe("Morgonstart numbers", () => {
  it("does not claim a newer unsaved draft was saved when an earlier request finishes", async () => {
    let resolve!: () => void;
    fixture.save.mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; }));
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Fler minuter mellan puffarna" }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Max antal uppföljningar"), { target: { value: "6" } });
    await act(async () => { resolve(); });
    expect(screen.getByLabelText("Max antal uppföljningar")).toHaveValue(6);
    expect(screen.getByRole("status")).toHaveTextContent("Osparade ändringar");
  });
  it("allows setting numbers while off and clearing a field without replacing the draft", async () => {
    await open();
    const interval = screen.getByLabelText("Puff igen efter (min)");
    const max = screen.getByLabelText("Max antal uppföljningar");
    expect(interval).toBeEnabled();
    expect(max).toBeEnabled();
    fireEvent.change(interval, { target: { value: "" } });
    expect(interval).toHaveValue(null);
    expect(fixture.save).not.toHaveBeenCalled();
    fireEvent.change(interval, { target: { value: "15" } });
    fireEvent.change(max, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Spara" }));
    await waitFor(() =>
      expect(fixture.save).toHaveBeenLastCalledWith({
        data: {
          wake_enabled: false,
          wake_time: "07:00",
          wake_interval_min: 15,
          wake_max_followups: 2,
        },
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Sparat");
  });

  it("supports step buttons and never saves an out-of-range or empty value", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Fler minuter mellan puffarna" }));
    fireEvent.click(screen.getByRole("button", { name: "Färre uppföljningar" }));
    await waitFor(() =>
      expect(fixture.save).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ wake_interval_min: 9, wake_max_followups: 3 }),
      }),
    );
    fixture.save.mockClear();
    fireEvent.change(screen.getByLabelText("Puff igen efter (min)"), { target: { value: "2" } });
    fireEvent.blur(screen.getByLabelText("Puff igen efter (min)"));
    expect(screen.getByRole("alert")).toHaveTextContent("3–30 minuter");
    expect(fixture.save).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Puff igen efter (min)")).toHaveValue(2);
  });

  it("serializes successive saves so a slower earlier save cannot overwrite the final settings", async () => {
    let resolve!: () => void;
    fixture.save.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Fler minuter mellan puffarna" }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Fler uppföljningar" }));
    expect(fixture.save).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve();
    });
    await waitFor(() => expect(fixture.save).toHaveBeenCalledTimes(2));
    expect(fixture.save).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ wake_interval_min: 9, wake_max_followups: 5 }),
    });
  });

  it("keeps chosen numbers and offers retry when saving fails", async () => {
    fixture.save.mockRejectedValueOnce(new Error("offline"));
    await open();
    fireEvent.change(screen.getByLabelText("Max antal uppföljningar"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Spara" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Kunde inte spara"));
    expect(screen.getByLabelText("Max antal uppföljningar")).toHaveValue(6);
    fireEvent.click(screen.getByRole("button", { name: "Spara" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sparat"));
  });
});
