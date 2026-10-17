import { useRef, useState } from "react";
import { createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPlanner from "./calendar-planner";
import { todayISO } from "@/lib/day";
import type { Child } from "@/hooks/use-children";
import type { ChildScheduleInput } from "@/lib/add-child-schedule";
import { decodeVisualNotes } from "@/lib/child-visual-schedule";
import type { CalendarEntry } from "@/lib/visual-calendar";
import { periodDates } from "@/lib/visual-calendar";

const fixture: CalendarEntry = { id: "task-a", sourceId: "a", source: "task", date: todayISO(), title: "Fika med Sara", time: "09:00", endTime: "09:30", done: false, editable: true };
const model = { entries: [fixture], ready: true, error: false };
const write = vi.fn();
const addChild = vi.fn(async (_input: ChildScheduleInput) => "created");
const children: Child[] = ["Bella", "Bianca", "Foreign"].map((name, i) => ({ id: name, name, owner_id: i === 2 ? "other" : "owner", birthdate: null, color: "", note: null, helps: [], avatar: null }));
beforeEach(() => { addChild.mockReset(); addChild.mockResolvedValue("created"); write.mockClear(); model.entries = [fixture]; model.ready = true; model.error = false; });
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: "owner" } }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-text-layout", () => ({ useTextLayout: () => ({ ref: useRef(null), enlarged: false }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial), getSyncUser: async () => ({ id: "owner" }) }));
vi.mock("@/hooks/use-visual-calendar", () => ({ useVisualCalendar: (dates: string[]) => ({ days: Object.fromEntries(dates.map(date => [date, model.entries.filter(entry => entry.date === date)])), familyMembers: [], externalError: null, planningReady: model.ready, planningError: model.error }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ tasks: model.entries.filter(entry => entry.source === "task").map(entry => ({ id: entry.sourceId, dueDate: entry.date, title: entry.title, time: entry.time, endTime: entry.endTime })), addTask: write, updateTask: write }), useReminders: () => ({ reminders: [], addReminder: write, updateReminder: write }) }));
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
  it("keeps empty weeks short and explicitly opens or collapses all 24 hours without saving anything", () => {
    model.entries = [];
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(container.querySelectorAll(".pace-calendar-timeline")).toHaveLength(0);
    expect(container.querySelectorAll("[data-calendar-empty-day]")).toHaveLength(7);
    const before = write.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Visa hela dygnet (00–24)" }));
    const timelines = container.querySelectorAll(".pace-calendar-timeline");
    expect(timelines).toHaveLength(7);
    for (const timeline of timelines) {
      expect(timeline).toHaveAttribute("data-calendar-timeline-start", "0");
      expect(timeline).toHaveAttribute("data-calendar-timeline-end", "1440");
      expect(within(timeline as HTMLElement).getByText("24:00")).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Visa kompakt" }));
    expect(container.querySelectorAll(".pace-calendar-timeline")).toHaveLength(0);
    expect(write).toHaveBeenCalledTimes(before);
    expect(addChild).not.toHaveBeenCalled();
  });
  it("only draws timed days in a sparse week and fits the occupied time", () => {
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(container.querySelectorAll(".pace-calendar-timeline")).toHaveLength(1);
    expect(container.querySelectorAll("[data-calendar-empty-day]")).toHaveLength(6);
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline")!;
    expect(parseFloat(timeline.style.height)).toBeLessThan(500);
    expect(screen.getByText(fixture.title)).toBeInTheDocument();
  });
  it("retains untimed activities and never presents a failed or loading read as an empty plan", () => {
    model.entries = [{ ...fixture, time: undefined, endTime: undefined }];
    const page = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(page.container.querySelectorAll(".pace-calendar-timeline")).toHaveLength(0);
    expect(screen.getByText(fixture.title)).toBeInTheDocument();
    model.entries = [];
    model.ready = false;
    page.rerender(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(screen.queryByText("Inget planerat.")).not.toBeInTheDocument();
    expect(screen.getAllByText("Laddar kalendern...")).toHaveLength(7);
    model.error = true;
    page.rerender(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(screen.getAllByText("Kalenderunderlaget kunde inte hämtas helt.")).toHaveLength(7);
  });
  it("shows a late child activity fully, including its touch target after the 24:00 line", () => {
    model.entries = [{ ...fixture, id: "child-night", source: "child", sourceId: "night", time: "23:59", endTime: undefined, title: "Kvällsrutin", editable: false, familyMembers: [{ id: "Bella", name: "Bella" }] }];
    const { container } = render(<CalendarPlanner initialView="dag" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline")!;
    expect(timeline).toHaveAttribute("data-calendar-timeline-end", "1440");
    expect(screen.getByText("24:00")).toBeInTheDocument();
    const card = screen.getByRole("button", { name: /Kvällsrutin, 23:59/ }).closest<HTMLElement>(".absolute")!;
    expect(parseFloat(card.style.top) + parseFloat(card.style.height)).toBeLessThanOrEqual(parseFloat(timeline.style.height));
  });
  it("shares one range across occupied week columns, including early family context", () => {
    const week = periodDates(fixture.date, "vecka");
    model.entries = [fixture, { ...fixture, id: "early", sourceId: "early", source: "child", title: "Tidig avfärd", date: week[0]!, time: "05:00", endTime: "05:30", editable: false, familyMembers: [{ id: "Bella", name: "Bella" }] }];
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timelines = container.querySelectorAll(".pace-calendar-timeline");
    expect(timelines.length).toBeGreaterThan(0);
    for (const timeline of timelines) {
      expect(timeline).toHaveAttribute("data-calendar-timeline-start", "240");
      expect(timeline).toHaveAttribute("data-calendar-timeline-end", "660");
    }
  });
  it("uses the displayed time origin when dragging in compact and full-day views", () => {
    const { container } = render(<CalendarPlanner initialView="dag" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const dragTo = (minute: number) => {
      const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline")!;
      const first = Number(timeline.dataset.calendarTimelineStart);
      vi.spyOn(timeline, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
      const event = createEvent.drop(timeline, { dataTransfer: { getData: () => fixture.id } });
      Object.defineProperty(event, "clientY", { value: 100 + (minute - first) * 1.7 });
      fireEvent(timeline, event);
    };
    dragTo(10 * 60);
    expect(write).toHaveBeenLastCalledWith("a", expect.objectContaining({ time: "10:00", endTime: "10:30" }));
    fireEvent.click(screen.getByRole("button", { name: "Visa hela dygnet (00–24)" }));
    dragTo(22 * 60 + 15);
    expect(write).toHaveBeenLastCalledWith("a", expect.objectContaining({ time: "22:15", endTime: "22:45" }));
  });
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

describe("Calendar month summary", () => {
  it("summarises the displayed month honestly and puts the activity count in each day cell", () => {
    model.entries = [fixture];
    const { container } = render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    expect(screen.getByText(/1 aktivitet · 1 dag med innehåll · \d+ dagar utan planering/)).toBeInTheDocument();
    const todayCell = container.querySelector<HTMLElement>(`[data-month-date="${fixture.date}"]`)!;
    expect(todayCell).toHaveAttribute("aria-label", expect.stringMatching(/1 aktivitet, 1 områden har planerat innehåll/));
    expect(todayCell.textContent).toContain("1");
  });
  it("lists the selected day compactly: timed first in clock order, then untimed, also without picture support", () => {
    model.entries = [fixture, { ...fixture, id: "task-b", sourceId: "b", title: "Ring banken", time: undefined, endTime: undefined }, { ...fixture, id: "task-c", sourceId: "c", title: "Morgonpromenad", time: "07:00", endTime: "07:15" }];
    render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const list = screen.getByText("Min dag").closest("h3")!.nextElementSibling as HTMLElement;
    const titles = Array.from(list.querySelectorAll("button")).map(b => b.textContent ?? "");
    expect(titles).toEqual([expect.stringContaining("Morgonpromenad"), expect.stringContaining("Fika med Sara"), expect.stringContaining("Ring banken")]);
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
