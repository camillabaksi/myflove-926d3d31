import { type ReactNode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder } from "@/hooks/use-data";
import { setCollapsed } from "@/lib/collapse-store";
import RemindersPage from "./reminders";

const data = vi.hoisted(() => ({
  reminders: [] as Reminder[],
  addReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  cancelReminder: vi.fn(),
  restoreReminder: vi.fn(),
}));
vi.mock("@/hooks/use-data", () => ({ useReminders: () => data }));
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/myflove", () => ({
  MyFloveHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  MyFloveIcon: () => null,
}));
vi.mock("@/components/push-status-card", () => ({ default: () => null }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const reminder = (patch: Partial<Reminder>): Reminder => ({
  id: "one",
  title: "En påminnelse",
  date: "2026-10-12",
  time: "11:00",
  completed: false,
  createdAt: 1,
  ...patch,
});
const openHistory = () => fireEvent.click(screen.getByRole("button", { name: /Historik \(/ }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(new Date(2026, 9, 12, 10, 30));
  vi.clearAllMocks();
  for (const path of ["", "/"]) {
    setCollapsed(`${path}::myflove-block::reminders-active`, false, true);
    setCollapsed(`${path}::myflove-block::reminders-history`, true, true);
    setCollapsed(`${path}::myflove-block::reminders-canceled`, false, true);
  }
  data.reminders = [];
});
afterEach(() => vi.useRealTimers());

describe("reminder history", () => {
  it("separates passed and completed one-offs from active recurring reminders without writing data", () => {
    data.reminders = [
      reminder({ id: "past", title: "Gammal engångspåminnelse", date: "2026-10-11" }),
      reminder({ id: "future", title: "Framtida påminnelse" }),
      reminder({ id: "daily", title: "Återkommande", date: "2025-01-01", repeat: "daily" }),
      reminder({ id: "done", title: "Redan klar", completed: true }),
      reminder({ id: "cancel", title: "Avbokad tid", canceled: true }),
    ];
    render(<RemindersPage />);
    const active = screen.getByRole("list", { name: "Aktiva påminnelser" });
    expect(within(active).getByText("Framtida påminnelse")).toBeVisible();
    expect(within(active).getByText("Återkommande")).toBeVisible();
    expect(within(active).queryByText("Gammal engångspåminnelse")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Historik \(2\)/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    openHistory();
    const history = screen.getByRole("list", { name: "Påminnelsehistorik" });
    expect(within(history).getByText("Passerad")).toBeVisible();
    expect(within(history).getByText("Klar")).toBeVisible();
    expect(data.updateReminder).not.toHaveBeenCalled();
    expect(data.deleteReminder).not.toHaveBeenCalled();
    expect(data.cancelReminder).not.toHaveBeenCalled();
  });

  it("requires a new time before explicitly reactivating a completed or canceled reminder", () => {
    data.reminders = [
      reminder({
        title: "Gammal avbokad",
        date: "2026-10-11",
        time: "09:00",
        canceled: true,
        completed: true,
      }),
    ];
    render(<RemindersPage />);
    fireEvent.click(screen.getByRole("button", { name: "Planera igen" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara och aktivera" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Välj ett datum eller klockslag som inte har passerat.",
    );
    expect(data.updateReminder).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Datum"), { target: { value: "2026-10-13" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara och aktivera" }));
    expect(data.updateReminder).toHaveBeenCalledWith("one", {
      title: "Gammal avbokad",
      date: "2026-10-13",
      time: "09:00",
      note: undefined,
      completed: false,
      canceled: false,
    });
    expect(data.restoreReminder).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not reuse a passed start time just because the original period ends later", () => {
    data.reminders = [
      reminder({ completed: true, time: "09:00", endDate: "2026-10-13", endTime: "18:00" }),
    ];
    render(<RemindersPage />);
    openHistory();
    fireEvent.click(screen.getByRole("button", { name: "Planera igen" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara och aktivera" }));
    expect(within(dialog).getByRole("alert")).toBeVisible();
    expect(data.updateReminder).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Klockslag"), { target: { value: "12:00" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Spara och aktivera" }));
    expect(data.updateReminder).toHaveBeenCalledWith(
      "one",
      expect.objectContaining({
        date: "2026-10-12",
        time: "12:00",
        endDate: "2026-10-13",
        endTime: "18:00",
        completed: false,
        canceled: false,
      }),
    );
  });

  it("moves a row to history while preserving the open edit draft", () => {
    data.reminders = [reminder({ title: "Tid snart", time: "10:31" })];
    render(<RemindersPage />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Anteckning (valfritt)"), {
      target: { value: "Påbörjad text" },
    });
    act(() => vi.advanceTimersByTime(90_000));
    expect(within(screen.getByRole("dialog")).getByLabelText("Anteckning (valfritt)")).toHaveValue(
      "Påbörjad text",
    );
    expect(data.updateReminder).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    expect(screen.getByRole("button", { name: /Aktiva \(0\)/ })).toBeVisible();
    openHistory();
    expect(
      within(screen.getByRole("list", { name: "Påminnelsehistorik" })).getByText("Tid snart"),
    ).toBeVisible();
  });

  it("preserves a draft during an external reminder update", () => {
    data.reminders = [reminder({ title: "Min titel" })];
    const view = render(<RemindersPage />);
    fireEvent.click(screen.getByRole("button", { name: "Ändra" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText("Vad gäller det?"), {
      target: { value: "Min påbörjade ändring" },
    });
    data.reminders = [reminder({ title: "Synkad titel", date: "2026-10-11" })];
    view.rerender(<RemindersPage />);
    expect(within(screen.getByRole("dialog")).getByLabelText("Vad gäller det?")).toHaveValue(
      "Min påbörjade ändring",
    );
  });

  it("starts a new reminder on the local calendar date near UTC midnight", () => {
    const localMidnight = new Date(2026, 9, 12, 0, 30);
    vi.setSystemTime(localMidnight);
    render(<RemindersPage />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    expect(within(screen.getByRole("dialog")).getByLabelText("Datum")).toHaveValue("2026-10-12");
  });
});
