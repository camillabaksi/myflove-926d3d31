import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/hooks/use-data";
import type { CalendarEntry } from "@/lib/visual-calendar";
import { DayReplanButton, DayReplanDialog } from "./day-replan";

const state = vi.hoisted(() => ({
  tasks: [] as Task[],
  addTask: vi.fn(),
  energyEntries: [] as Array<Record<string, unknown>>,
  apply: vi.fn(), track: vi.fn(), close: vi.fn(), success: vi.fn(), owner: "a", user: "a",
}));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ tasks: state.tasks, addTask: state.addTask, applyDayReplan: state.apply }) }));
vi.mock("@/hooks/use-energy-flow", () => ({ useEnergyFlow: () => ({
  entries: state.energyEntries, loading: false, signedIn: true,
}) }));
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: state.user } }) }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (id: string) => id === state.owner, getDataOwner: () => state.owner }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/lib/analytics", () => ({ track: state.track }));
vi.mock("sonner", () => ({ toast: { success: state.success, error: vi.fn() } }));
const date = "2026-10-15";
const fixed = (id: string, time: string, endTime: string): CalendarEntry => ({ id, sourceId: id, source: "external", date, title: id, time, endTime, editable: false, done: false });
const entries = (): CalendarEntry[] => [
  ...state.tasks.map(task => ({ id: `task-${task.id}`, sourceId: task.id, source: "task" as const, date, title: task.title, time: task.time, endTime: task.endTime, editable: true, done: false })),
  fixed("Studier", "13:00", "14:00"), fixed("Hämtning", "14:30", "15:00"), fixed("Bokat", "16:30", "17:00"),
];
const show = (capacity: number | null = null) => render(<DayReplanDialog date={date} entries={entries()} capacity={capacity} calendarReady ownerId="a" onClose={state.close} />);
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-15T13:00:00")); state.owner = "a"; state.user = "a";
  state.tasks = [{ id: "shop", title: "Handla", time: "14:00", endTime: "14:45", dueDate: date, completed: false, createdAt: 1 }];
  state.energyEntries = [];
});
afterEach(() => vi.useRealTimers());
describe("Review and approve day proposals", () => {
  it("works without a check-in and changes nothing until a proposal is selected and approved", () => {
    show();
    expect(screen.getByText(/Ingen kapacitet är loggad/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Använd valda ändringar/ })).toBeDisabled();
    expect(state.apply).not.toHaveBeenCalled();
    const proposal = screen.getByText("Handla").closest("label")!;
    fireEvent.click(within(proposal).getByRole("checkbox"));
    expect(state.apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Använd valda ändringar/ }));
    expect(state.apply).toHaveBeenCalledWith(state.tasks, [expect.objectContaining({ taskId: "shop", patch: { time: "15:15", endTime: "16:00" } })], date, "a");
    expect(state.close).toHaveBeenCalledOnce();
    expect(state.track).toHaveBeenCalledWith("day_replanned", { source: "idag", count: 1 });
  });
  it("uses logged zero capacity and lets the user switch off that input", () => {
    state.tasks = [{ ...state.tasks[0], title: "Städa", time: undefined, endTime: undefined, friction: "large" }];
    show(0);
    const checkbox = screen.getByRole("checkbox", { name: /Utgå från min loggade kapacitet/ });
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/Din kapacitet är låg just nu/)).toBeInTheDocument();
    expect(screen.getByText("Föreslagna ändringar")).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(screen.queryByText("Föreslagna ändringar")).not.toBeInTheDocument();
    expect(state.apply).not.toHaveBeenCalled();
  });
  it("cancel and closing on an account change never write the proposal", () => {
    const view = render(<DayReplanButton date={date} entries={entries()} capacity={45} calendarReady />);
    fireEvent.click(screen.getByRole("button", { name: /Få ihop dagen/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Behåll min dag" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Få ihop dagen/ }));
    state.user = "b"; state.owner = "b";
    view.rerender(<DayReplanButton date={date} entries={[]} capacity={null} calendarReady />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(state.apply).not.toHaveBeenCalled();
  });
  it("blocks stale calendar/capacity previews and requires a fresh review", () => {
    const view = show(45);
    fireEvent.click(within(screen.getByText("Handla").closest("label")!).getByRole("checkbox"));
    view.rerender(<DayReplanDialog date={date} entries={[...entries(), fixed("Nytt möte", "15:15", "16:00")]} capacity={10} calendarReady ownerId="a" onClose={state.close} />);
    expect(screen.getByRole("button", { name: /Använd valda ändringar/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Uppdatera förslaget" })).toBeInTheDocument();
    expect(state.apply).not.toHaveBeenCalled();
  });
  it("blocks suggested recovery after a completed activity changes capacity until the preview is refreshed", () => {
    state.energyEntries = [{
      id: "walk-1", title: "Lugn promenad", direction: "gives", strength: 2,
      category: "annat", kind: "planerat", friction: null, note: "Genomförd aktivitet",
      countsTowardScore: true, occurredAt: "2026-10-14T12:00:00.000Z",
    }];
    const view = show(45);
    fireEvent.click(screen.getByText("Återhämta · ge plats för det som hjälper"));
    fireEvent.click(screen.getByRole("button", { name: /Lugn promenad/ }));
    const doNow = screen.getByRole("button", { name: "Gör nu · lägg till utan tid" });
    expect(doNow).toBeEnabled();

    // A new energy log changed the same capacity used by Idag and this plan.
    view.rerender(<DayReplanDialog date={date} entries={entries()} capacity={10} calendarReady ownerId="a" onClose={state.close} />);
    expect(screen.getByRole("button", { name: "Uppdatera förslaget" })).toBeInTheDocument();
    expect(doNow).toBeDisabled();
    fireEvent.click(doNow);
    expect(state.addTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Uppdatera förslaget" }));
    expect(doNow).toBeEnabled();
    fireEvent.click(doNow);
    expect(state.addTask).toHaveBeenCalledExactlyOnceWith("Lugn promenad", date, expect.objectContaining({
      energyImpact: "gives",
    }));
    expect(state.apply).not.toHaveBeenCalled();
  });

  it("does not create duplicate recovery tasks when the same proposal is accepted twice in an open dialog", () => {
    state.energyEntries = [{
      id: "walk-1", title: "Lugn promenad", direction: "gives", strength: 2,
      category: "annat", kind: "planerat", friction: null, note: "Genomförd aktivitet",
      countsTowardScore: true, occurredAt: "2026-10-14T12:00:00.000Z",
    }];
    show(45);
    fireEvent.click(screen.getByText("Återhämta · ge plats för det som hjälper"));
    const openSuggestion = () => fireEvent.click(screen.getByRole("button", { name: /Lugn promenad/ }));
    openSuggestion();
    fireEvent.click(screen.getByRole("button", { name: "Gör nu · lägg till utan tid" }));
    expect(state.addTask).toHaveBeenCalledTimes(1);
    // Same dialog, same choice, as if the first tap hadn't been registered.
    openSuggestion();
    fireEvent.click(screen.getByRole("button", { name: "Gör nu · lägg till utan tid" }));
    expect(state.addTask).toHaveBeenCalledTimes(1);

    // A separately chosen time is deliberate and remains available.
    fireEvent.change(screen.getByRole("combobox", { name: "Timme" }), { target: { value: "15" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Minut" }), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Lägg till i min dag" }));
    expect(state.addTask).toHaveBeenCalledTimes(2);
    expect(state.addTask).toHaveBeenLastCalledWith("Lugn promenad", date, expect.objectContaining({
      time: "15:10", energyImpact: "gives",
    }));
  });

  it("keeps a failed recovery save retryable without claiming it was added", () => {
    state.energyEntries = [{
      id: "walk-1", title: "Lugn promenad", direction: "gives", strength: 2,
      category: "annat", kind: "planerat", friction: null, note: null,
      countsTowardScore: true, occurredAt: "2026-10-14T12:00:00.000Z",
    }];
    state.addTask.mockImplementationOnce(() => { throw new Error("disk full"); });
    show(45);
    fireEvent.click(screen.getByText("Återhämta · ge plats för det som hjälper"));
    fireEvent.click(screen.getByRole("button", { name: /Lugn promenad/ }));
    fireEvent.click(screen.getByRole("button", { name: "Gör nu · lägg till utan tid" }));
    expect(state.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Gör nu · lägg till utan tid" }));
    expect(state.addTask).toHaveBeenCalledTimes(2);
    expect(state.success).toHaveBeenCalledOnce();
  });

  it("keeps a failed update open and never reports success", () => {
    state.apply.mockImplementationOnce(() => { throw new Error("Uppgifterna har ändrats"); });
    show();
    fireEvent.click(within(screen.getByText("Handla").closest("label")!).getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Använd valda ändringar/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Uppgifterna har ändrats");
    expect(state.close).not.toHaveBeenCalled(); expect(state.success).not.toHaveBeenCalled();
  });
  it("requires explicit selection for tomorrow and shows the date change before applying", () => {
    state.tasks = [{ ...state.tasks[0], id: "laundry", title: "Tvätta", time: "19:00", endTime: "19:45" }];
    show();
    fireEvent.click(screen.getByText("Vad kan få vänta till imorgon?"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Tvätta" }));
    expect(screen.getByText("Imorgon · utan tid")).toBeInTheDocument();
    expect(state.apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Använd valda ändringar/ }));
    expect(state.apply).toHaveBeenCalledWith(state.tasks, [expect.objectContaining({ kind: "tomorrow", patch: { dueDate: "2026-10-16", time: undefined, endTime: undefined } })], date, "a");
  });
});
