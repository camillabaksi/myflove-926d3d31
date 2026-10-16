import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeeklyPulse, { WeeklyPulseDialog } from "./weekly-pulse";
import { PULSE_QUESTIONS, pulseWeekStart, type PulseEntry } from "@/lib/weekly-pulse";

const mocks = vi.hoisted(() => ({
  uid: "00000000-0000-4000-8000-000000000001",
  read: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
}));
vi.mock("@clerk/react", () => ({
  useUser: () => ({ user: mocks.uid ? { id: mocks.uid } : null }),
}));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (uid: string) => uid === mocks.uid }));
vi.mock("@/lib/weekly-pulse.functions", () => ({
  getMyWeeklyPulseFn: mocks.read,
  updateMyWeeklyPulseFn: mocks.update,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
const ownerId = "00000000-0000-4000-8000-000000000001";
function entry(saved = false): PulseEntry {
  return {
    week_start: pulseWeekStart(),
    opened_at: new Date().toISOString(),
    dismissed_at: null,
    submitted_at: saved ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    revision: saved ? 1 : 0,
    overview: saved ? 4 : null,
    relief: saved ? 3 : null,
    burden: saved ? 2 : null,
  };
}
function show(dialog = true, saved = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const close = vi.fn();
  const view = render(
    <QueryClientProvider client={client}>
      {dialog ? (
        <WeeklyPulseDialog
          ownerId={ownerId}
          weekStart={pulseWeekStart()}
          entry={entry(saved)}
          onClose={close}
        />
      ) : (
        <WeeklyPulse />
      )}
    </QueryClientProvider>,
  );
  return { ...view, close, client };
}
function answer() {
  PULSE_QUESTIONS.forEach((question, index) =>
    fireEvent.click(
      within(screen.getByRole("group", { name: question.label })).getByRole("radio", {
        name: String(index + 2),
      }),
    ),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.uid = ownerId;
  mocks.read.mockResolvedValue({ weekStart: pulseWeekStart(), entry: null });
  mocks.update.mockResolvedValue(undefined);
});

describe("Voluntary weekly pulse", () => {
  it("reads on Today without writing or opening a dialog until the user chooses", async () => {
    show(false);
    await screen.findByRole("button", { name: "Svara" });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    mocks.read.mockResolvedValue({ weekStart: pulseWeekStart(), entry: entry() });
    fireEvent.click(screen.getByRole("button", { name: "Svara" }));
    await screen.findByRole("dialog");
    expect(mocks.update).toHaveBeenCalledWith({
      data: { expectedUserId: ownerId, weekStart: pulseWeekStart(), action: "open" },
    });
  });
  it("pauses the invitation with no survey answers when Inte nu is chosen", async () => {
    show(false);
    await screen.findByRole("button", { name: "Inte nu" });
    mocks.read.mockResolvedValue({
      weekStart: pulseWeekStart(),
      entry: { ...entry(), opened_at: null, dismissed_at: new Date().toISOString() },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inte nu" }));
    await screen.findByText("Veckopulsen kan vänta.");
    expect(mocks.update).toHaveBeenCalledWith({
      data: { expectedUserId: ownerId, weekStart: pulseWeekStart(), action: "dismiss" },
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("starts without selected values and writes only on explicit completed submission", async () => {
    const { close } = show();
    expect(
      screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Skicka mina svar" })).toBeDisabled();
    answer();
    expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(mocks.update).toHaveBeenCalledWith({
      data: {
        expectedUserId: ownerId,
        weekStart: pulseWeekStart(),
        action: "submit",
        revision: 0,
        consent: true,
        overview: 2,
        relief: 3,
        burden: 4,
      },
    });
  });
  it("keeps selections and the dialog open when saving fails", async () => {
    mocks.update.mockRejectedValue(new Error("Kunde inte spara. Dina val finns kvar här."));
    const { close } = show();
    answer();
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    await screen.findByRole("alert");
    expect(close).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("group", { name: PULSE_QUESTIONS[0].label })).getByRole("radio", {
        name: "2",
      }),
    ).toBeChecked();
  });
  it("waits for the database before confirming and prevents double submits", async () => {
    let resolve!: () => void;
    mocks.update.mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { close } = show();
    answer();
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    expect(screen.getByRole("button", { name: "Sparar…" })).toBeDisabled();
    expect(close).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    resolve();
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
  it("keeps both the draft and its original revision when query data changes", async () => {
    const client = new QueryClient();
    const close = vi.fn();
    const view = render(
      <QueryClientProvider client={client}>
        <WeeklyPulseDialog
          ownerId={ownerId}
          weekStart={pulseWeekStart()}
          entry={entry()}
          onClose={close}
        />
      </QueryClientProvider>,
    );
    answer();
    view.rerender(
      <QueryClientProvider client={client}>
        <WeeklyPulseDialog
          ownerId={ownerId}
          weekStart={pulseWeekStart()}
          entry={entry(true)}
          onClose={close}
        />
      </QueryClientProvider>,
    );
    expect(
      within(screen.getByRole("group", { name: PULSE_QUESTIONS[0].label })).getByRole("radio", {
        name: "2",
      }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].data.revision).toBe(0);
  });
  it("blocks saves after the account changes", async () => {
    show();
    answer();
    mocks.uid = "00000000-0000-4000-8000-000000000002";
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    await screen.findByRole("alert");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("blocks saves across a Swedish week boundary", async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <WeeklyPulseDialog
          ownerId={ownerId}
          weekStart="2000-01-03"
          entry={entry()}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    );
    answer();
    fireEvent.click(screen.getByRole("button", { name: "Skicka mina svar" }));
    await screen.findByRole("alert");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("requires a second choice before withdrawing and removes only this week's answer", async () => {
    const { close } = show(true, true);
    fireEvent.click(screen.getByRole("button", { name: "Ta bort veckans svar" }));
    expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ja, ta bort veckans svar" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(mocks.update).toHaveBeenCalledWith({
      data: {
        expectedUserId: ownerId,
        weekStart: pulseWeekStart(),
        action: "withdraw",
        revision: 1,
      },
    });
  });
  it("closing a draft does not send answers", () => {
    const { close } = show();
    answer();
    fireEvent.click(screen.getByRole("button", { name: "Stäng utan att skicka" }));
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
