import { useRef, useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPlanner from "./calendar-planner";
import { todayISO } from "@/lib/day";
import type { Child } from "@/hooks/use-children";
import type { ChildScheduleInput } from "@/lib/add-child-schedule";
import { decodeVisualNotes } from "@/lib/child-visual-schedule";
import type { CalendarEntry } from "@/lib/visual-calendar";

const fixture: CalendarEntry = { id: "task-a", sourceId: "a", source: "task", date: todayISO(), title: "Fika med Sara", time: "09:00", endTime: "09:30", done: false, editable: true };
const write = vi.fn();
const addChild = vi.fn(async (_input: ChildScheduleInput) => "created");
const children: Child[] = ["Bella", "Bianca", "Foreign"].map((name, i) => ({ id: name, name, owner_id: i === 2 ? "other" : "owner", birthdate: null, color: "", note: null, helps: [], avatar: null }));
beforeEach(() => { addChild.mockReset(); addChild.mockResolvedValue("created"); });
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: "owner" } }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-text-layout", () => ({ useTextLayout: () => ({ ref: useRef(null), enlarged: false }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial), getSyncUser: async () => ({ id: "owner" }) }));
vi.mock("@/hooks/use-visual-calendar", () => ({ useVisualCalendar: (dates: string[]) => ({ days: Object.fromEntries(dates.map(date => [date, date === fixture.date ? [fixture] : []])), familyMembers: [], externalError: null }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ tasks: [], addTask: write, updateTask: write }), useReminders: () => ({ reminders: [], addReminder: write, updateReminder: write }) }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: () => true }));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({ children, items: [], updateItem: write, addItem: addChild }) }));
vi.mock("@/hooks/use-flow-items", () => ({ useFlowItems: () => ({ today: [], toggleItem: write }) }));
vi.mock("@/hooks/use-capacity-mode", () => ({ useCapacityMode: () => ({ mode: "normal" }) }));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => ({ percent: null }) }));
vi.mock("@/components/flow-item-actions", () => ({ FlowItemActions: () => null }));
vi.mock("@/components/flow-mascot", () => ({ FlowMascot: () => null }));
vi.mock("@/components/calendar/family-layer-settings", () => ({ FamilyLayerSettings: () => null }));

function Harness() {
  const [show, setShow] = useState(false);
  return <CalendarPlanner tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} showPictograms={show} onPictogramsChange={setShow} />;
}

describe("Calendar entry view", () => {
  it("opens the requested week and still lets the user choose another view", () => {
    render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(screen.getByRole("button", { name: "Vecka" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("group", { name: "Månadskalender" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Fika med Sara").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Månad" }));
    expect(screen.getByRole("button", { name: "Månad" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: "Månadskalender" })).toBeInTheDocument();
  });
});

describe("Calendar picture support", () => {
  it("toggles compact original symbols in summaries/day/week without filling month cells", () => {
    const { container } = render(<Harness />);
    expect(container.querySelector("[data-mulberry-symbol]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Bildstöd" }));
    expect(screen.getByRole("button", { name: "Bildstöd" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector('[data-mulberry-symbol="coffee"]')).toHaveClass("h-8", "w-8");
    expect(container.querySelector("[data-month-date] img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dag" }));
    expect(container.querySelector('[data-mulberry-symbol="coffee"]')).toHaveClass("h-8", "w-8");
    fireEvent.click(screen.getByRole("button", { name: "Vecka" }));
    expect(container.querySelector('[data-mulberry-symbol="coffee"]')).toHaveClass("h-7", "w-7");
    fireEvent.click(screen.getByRole("button", { name: "Bildstöd" }));
    expect(container.querySelector("[data-mulberry-symbol]")).toBeNull();
    expect(screen.getByText("Fika med Sara")).toBeInTheDocument();
  });
});


describe("Calendar child quick-add", () => {
  it("opens the single existing form and saves an activity to two explicitly selected children", async () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Lägg till för barn" })).toHaveClass("text-xs");
    fireEvent.click(screen.getByRole("button", { name: "Lägg till för barn" }));
    const form = within(screen.getByRole("dialog"));
    expect(form.getByRole("button", { name: "Spara för 0 barn" })).toBeDisabled();
    expect(form.queryByRole("checkbox", { name: "Foreign" })).not.toBeInTheDocument();
    fireEvent.change(form.getByLabelText("Namn"), { target: { value: "Frukost" } });
    fireEvent.click(form.getByRole("checkbox", { name: "Bella" }));
    fireEvent.click(form.getByRole("checkbox", { name: "Bianca" }));
    fireEvent.change(form.getByLabelText("Tid"), { target: { value: "07:30" } });
    fireEvent.click(form.getByRole("button", { name: "30 min" }));
    expect(form.queryByText("Hur brukar det påverka din energi?")).not.toBeInTheDocument();
    expect(addChild).not.toHaveBeenCalled();
    fireEvent.click(form.getByRole("button", { name: "Spara för 2 barn" }));
    await waitFor(() => expect(addChild).toHaveBeenCalledTimes(2));
    expect(addChild.mock.calls.map(([value]) => value.childId)).toEqual(["Bella", "Bianca"]);
    for (const [value] of addChild.mock.calls) {
      expect(value).toMatchObject({ kind: "activity", title: "Frukost", date: fixture.date, time: "07:30" });
      expect(decodeVisualNotes(value.notes).meta).toMatchObject({ pictogram: "breakfast", endTime: "08:00", category: "mat" });
    }
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("keeps the draft after a partial failure and retries only the remaining child", async () => {
    addChild.mockImplementation(async value => { if (value.childId === "Bianca" && addChild.mock.calls.length === 2) throw Error("network"); return "created"; });
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till för barn" }));
    const form = within(screen.getByRole("dialog"));
    fireEvent.change(form.getByLabelText("Namn"), { target: { value: "Frukost" } });
    fireEvent.click(form.getByRole("checkbox", { name: "Bella" }));
    fireEvent.click(form.getByRole("checkbox", { name: "Bianca" }));
    fireEvent.click(form.getByRole("button", { name: "Spara för 2 barn" }));
    await waitFor(() => expect(form.getByRole("button", { name: "Spara för 1 barn" })).toBeEnabled());
    expect(form.getByLabelText("Namn")).toHaveValue("Frukost");
    expect(form.getByRole("checkbox", { name: "Bella" })).not.toBeChecked();
    fireEvent.click(form.getByRole("button", { name: "Spara för 1 barn" }));
    await waitFor(() => expect(addChild).toHaveBeenCalledTimes(3));
    expect(addChild.mock.calls.map(([value]) => value.childId)).toEqual(["Bella", "Bianca", "Bianca"]);
  });
});
