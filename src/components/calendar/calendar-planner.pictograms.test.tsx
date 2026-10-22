import { useRef, useState } from "react";
import type { ReactNode } from "react";
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
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
  useLocation: () => ["/kalender", () => {}] as const,
}));
vi.mock("@tanstack/react-router", async importOriginal => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={String(to)}>{children}</a> };
});
vi.mock("@/hooks/use-text-layout", () => ({ useTextLayout: () => ({ ref: useRef(null), enlarged: false }) }));
vi.mock("@/lib/cloud-storage", () => ({ ACCOUNT_BOUND_EVENT: "myflove-account-bound", useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial), getSyncUser: async () => ({ id: "owner" }) }));
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

function openChildForm() {
  fireEvent.click(screen.getByRole("button", { name: "Vecka" }));
  const days = screen.getByRole("region", { name: "Veckans dagar" });
  const weekday = new Date(`${fixture.date}T12:00:00`).getDay();
  const day = within(days).getAllByRole("button", { name: /^Öppna / })[weekday === 0 ? 6 : weekday - 1];
  if (!day) throw new Error("Expected today's week entry");
  fireEvent.click(day);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Lägg till i barnens schema" }));
}

describe("Calendar entry view", () => {
  it("offers the same simple add choices as Today, with optional extras and batch planning", () => {
    render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    const add = within(screen.getByRole("dialog"));
    const choices = within(add.getByRole("group", { name: "Vad gäller det?" }));
    expect(choices.getAllByRole("button").map(button => button.textContent)).toEqual(["Att göra", "Händelse", "Påminnelse"]);
    expect(choices.getByRole("button", { name: "Att göra" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(choices.getByRole("button", { name: "Påminnelse" }));
    fireEvent.change(add.getByLabelText("Tid"), { target: { value: "09:00" } });
    expect(add.getByRole("checkbox", { name: "Påminn mig vid start" })).toBeChecked();
    expect(add.getByText("Fler typer").closest("details")).not.toHaveAttribute("open");
    fireEvent.click(add.getByText("Fler typer"));
    fireEvent.click(add.getByRole("button", { name: "Återhämtning" }));
    expect(add.getByText("Återhämtning registreras som något som ger energi.")).toBeInTheDocument();
    expect(add.getByRole("link", { name: "Planera flera aktiviteter i stället" })).toHaveAttribute("href", "/planera");
    expect(write).not.toHaveBeenCalledWith(expect.objectContaining({ title: expect.any(String) }));
  });

  it("edits the selected month day through the shared day dialog without leaving month view", () => {
    render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const monthButton = screen.getByRole("button", { name: "Månad" });
    expect(monthButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: "Lägg till" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Visa och redigera dagen" }));
    const day = within(screen.getByRole("dialog"));
    expect(day.getByText("Visa, redigera eller lägg till aktiviteter för dagen.")).toBeInTheDocument();
    fireEvent.click(day.getByRole("button", { name: /Fika med Sara/ }));
    expect(monthButton).toBeInTheDocument();
    expect(monthButton).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Redigera aktivitet" })).toBeInTheDocument();
  });
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
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline");
    if (!timeline) throw new Error("Expected the occupied day's timeline");
    expect(parseFloat(timeline.style.height)).toBeLessThan(500);
    expect(within(timeline).getByText(fixture.title)).toBeInTheDocument();
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
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline");
    if (!timeline) throw new Error("Expected the late family activity's timeline");
    expect(timeline).toHaveAttribute("data-calendar-timeline-end", "1440");
    expect(screen.getByText("24:00")).toBeInTheDocument();
    const card = within(timeline).getByRole("button", { name: /Kvällsrutin, 23:59/ }).closest<HTMLElement>(".absolute");
    if (!card) throw new Error("Expected the late family activity's block");
    expect(parseFloat(card.style.top) + parseFloat(card.style.height)).toBeLessThanOrEqual(parseFloat(timeline.style.height));
  });
  it("shares one range across occupied week columns, including early family context", () => {
    const week = periodDates(fixture.date, "vecka");
    const firstDay = week[0];
    if (!firstDay) throw new Error("Expected the week's first day");
    model.entries = [fixture, { ...fixture, id: "early", sourceId: "early", source: "child", title: "Tidig avfärd", date: firstDay, time: "05:00", endTime: "05:30", editable: false, familyMembers: [{ id: "Bella", name: "Bella" }] }];
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timelines = container.querySelectorAll(".pace-calendar-timeline");
    expect(timelines.length).toBeGreaterThan(0);
    for (const timeline of timelines) {
      expect(timeline).toHaveAttribute("data-calendar-timeline-start", "240");
      expect(timeline).toHaveAttribute("data-calendar-timeline-end", "660");
    }
  });
  it("uses the displayed time origin when dragging in compact and full-day views", () => {
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const dragTo = (minute: number) => {
      const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline");
      if (!timeline) throw new Error("Expected the occupied day's timeline");
      const first = Number(timeline.dataset.calendarTimelineStart);
      vi.spyOn(timeline, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
      const event = createEvent.drop(timeline, { dataTransfer: { getData: () => fixture.id } });
      Object.defineProperty(event, "clientY", { value: 100 + (minute - first) * Number(timeline.dataset.calendarTimelineScale) });
      fireEvent(timeline, event);
    };
    dragTo(10 * 60);
    expect(write).toHaveBeenLastCalledWith("a", expect.objectContaining({ time: "10:00", endTime: "10:30" }));
    fireEvent.click(screen.getByRole("button", { name: "Visa hela dygnet (00–24)" }));
    dragTo(22 * 60 + 15);
    expect(write).toHaveBeenLastCalledWith("a", expect.objectContaining({ time: "22:15", endTime: "22:45" }));
  });
  it("anchors mobile events and the current-time marker to the same compressed hour scale", () => {
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline");
    if (!timeline) throw new Error("Expected the occupied timeline");
    expect(timeline.dataset.calendarTimelineScale).toBe("1.35");
    const first = Number(timeline.dataset.calendarTimelineStart);
    const block = within(timeline).getByRole("button", { name: /Fika med Sara, 09:00/ }).closest<HTMLElement>(".absolute");
    expect(Number.parseFloat(block?.style.top ?? "NaN")).toBeCloseTo((540 - first) * 1.35);
    fireEvent.click(screen.getByRole("button", { name: "Visa hela dygnet (00–24)" }));
    const marker = container.querySelector<HTMLElement>("[data-calendar-now]");
    const now = new Date();
    expect(Number.parseFloat(marker?.style.top ?? "NaN")).toBeCloseTo((now.getHours() * 60 + now.getMinutes()) * 1.35);
  });
  it("keeps short mobile activities in an accessible cluster without overlapping targets", () => {
    model.entries = [fixture, { ...fixture, id: "task-b", sourceId: "b", time: "09:30", endTime: "09:35", title: "Kort samtal" }];
    const { container } = render(<CalendarPlanner initialView="vecka" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const timeline = container.querySelector<HTMLElement>(".pace-calendar-timeline");
    if (!timeline) throw new Error("Expected the occupied timeline");
    const group = within(timeline).getByRole("button", { name: /2 aktiviteter/ });
    fireEvent.click(group);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: /Fika med Sara, 09:00/ })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /Kort samtal, 09:30/ })).toBeInTheDocument();
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
    fireEvent.click(within(screen.getByRole("group", { name: "Kalendervy" })).getByRole("button", { name: "Idag" }));
    expect(container.querySelector('[data-mulberry-symbol="coffee"]')).toHaveClass("h-8", "w-8");
    fireEvent.click(screen.getByRole("button", { name: "Vecka" }));
    expect(container.querySelector('[data-mulberry-symbol="coffee"]')).toHaveClass("h-7", "w-7");
    fireEvent.click(screen.getByRole("button", { name: "Bildstöd" }));
    expect(container.querySelector("[data-mulberry-symbol]")).toBeNull();
    const weekList = within(screen.getByRole("region", { name: "Veckans dagar" })).getAllByRole("list")[0];
    if (!weekList) throw new Error("Expected the occupied day's activity list");
    expect(within(weekList).getByText("Fika med Sara")).toBeInTheDocument();
  });
});

describe("Calendar month summary", () => {
  it("includes the real activity count in the selected date's accessible label", () => {
    model.entries = [fixture];
    const { container } = render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const todayCell = container.querySelector<HTMLElement>(`[data-month-date="${fixture.date}"]`);
    expect(todayCell).toHaveAttribute("aria-label", expect.stringMatching(/1 egen aktivitet eller närvaro, 0 familjehändelser\./));
  });
  it("shows an ongoing period separately without counting it as a daily activity", () => {
    model.entries = [fixture, { ...fixture, id: "period-course", sourceId: "course", source: "reminder", title: "Pågående kurs", time: undefined, endTime: undefined, periodEnd: fixture.date }];
    const { container } = render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const todayCell = container.querySelector<HTMLElement>(`[data-month-date="${fixture.date}"]`);
    expect(todayCell).toHaveAttribute("aria-label", expect.stringMatching(/1 egen aktivitet eller närvaro, 0 familjehändelser\./));
    const selectedDay = within(screen.getByRole("region", { name: "Vald dags aktiviteter" }));
    expect(selectedDay.getByText("Pågående perioder")).toBeInTheDocument();
    expect(selectedDay.getByRole("button", { name: /Pågående kurs/ })).toBeInTheDocument();
    const activityList = selectedDay.getByRole("list");
    expect(within(activityList).getAllByRole("button")).toHaveLength(1);
    expect(within(activityList).getByRole("button")).toHaveTextContent("Fika med Sara");
  });
  it("lists the selected day compactly: timed first in clock order, then untimed, also without picture support", () => {
    model.entries = [fixture, { ...fixture, id: "task-b", sourceId: "b", title: "Ring banken", time: undefined, endTime: undefined }, { ...fixture, id: "task-c", sourceId: "c", title: "Morgonpromenad", time: "07:00", endTime: "07:15" }];
    render(<CalendarPlanner initialView="manad" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    const list = within(screen.getByRole("region", { name: "Vald dags aktiviteter" })).getByRole("list");
    const titles = within(list).getAllByRole("button").map(b => b.textContent ?? "");
    expect(titles).toEqual([expect.stringContaining("Morgonpromenad"), expect.stringContaining("Fika med Sara"), expect.stringContaining("Ring banken")]);
  });
});


describe("Calendar child quick-add", () => {
  it("opens the single existing form and saves an activity to two explicitly selected children", async () => {
    render(<Harness />);
    openChildForm();
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
    openChildForm();
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
