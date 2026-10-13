import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CalendarPlanner from "./calendar-planner";
import { todayISO } from "@/lib/day";
import type { CalendarEntry } from "@/lib/visual-calendar";

const fixture: CalendarEntry = { id: "task-a", sourceId: "a", source: "task", date: todayISO(), title: "Fika med Sara", time: "09:00", endTime: "09:30", done: false, editable: true };
const write = vi.fn();
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: "owner" } }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-text-layout", () => ({ useTextLayout: () => ({ ref: useRef(null), enlarged: false }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial), getSyncUser: vi.fn() }));
vi.mock("@/hooks/use-visual-calendar", () => ({ useVisualCalendar: (dates: string[]) => ({ days: Object.fromEntries(dates.map(date => [date, date === fixture.date ? [fixture] : []])), familyMembers: [], externalError: null }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ tasks: [], addTask: write, updateTask: write }), useReminders: () => ({ reminders: [], addReminder: write, updateReminder: write }) }));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({ items: [], updateItem: write }) }));
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
