import { useState } from "react";
import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPlanner from "./calendar-planner";
import { todayISO } from "@/lib/day";
import type { CalendarEntry } from "@/lib/visual-calendar";
import type { RoutineOccurrenceException } from "@/lib/routine-occurrence-exceptions";

const written = vi.hoisted(() => ({ current: [] as RoutineOccurrenceException[] }));
const write = vi.fn();

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
vi.mock("@/hooks/use-text-layout", () => ({ useTextLayout: () => ({ ref: { current: null }, enlarged: false }) }));
vi.mock("@/lib/cloud-storage", () => ({
  ACCOUNT_BOUND_EVENT: "myflove-account-bound",
  useCloudSyncedStorage: (_key: string, initial: unknown) => {
    const [value, setValue] = useState(initial);
    return [value, (next: unknown) => {
      const resolved = typeof next === "function" ? (next as (prev: unknown) => unknown)(value) : next;
      written.current = resolved as RoutineOccurrenceException[];
      setValue(resolved);
    }];
  },
  getSyncUser: async () => ({ id: "owner" }),
}));
vi.mock("@/hooks/use-visual-calendar", () => ({
  useVisualCalendar: (dates: string[]) => ({
    days: Object.fromEntries(dates.map(day => [day, [{ ...routine, date: day }]])),
    familyMembers: [],
    externalError: null,
    planningReady: true,
    planningError: false,
  }),
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ tasks: [], addTask: write, updateTask: write }),
  useReminders: () => ({ reminders: [], addReminder: write, updateReminder: write }),
}));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: () => true }));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({ children: [], items: [], updateItem: write, addItem: write }) }));
vi.mock("@/hooks/use-flow-items", () => ({ useFlowItems: () => ({ today: [], toggleItem: write }) }));
vi.mock("@/hooks/use-capacity-mode", () => ({ useCapacityMode: () => ({ mode: "normal" }) }));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => ({ percent: null }) }));
vi.mock("@/components/flow-item-actions", () => ({ FlowItemActions: () => null }));
vi.mock("@/components/flow-mascot", () => ({ FlowMascot: () => null }));
vi.mock("@/components/calendar/family-layer-settings", () => ({ FamilyLayerSettings: () => null }));

const routine: CalendarEntry = {
  id: "routine-morgon", sourceId: "morgon", source: "routine", date: todayISO(), occurrenceDate: todayISO(),
  title: "Morgonrutin", time: "07:00", endTime: "07:15", done: false, editable: false,
};

describe("Routine exception for one day", () => {
  beforeEach(() => { written.current = []; write.mockClear(); });

  it("saves a typed time as today's routine exception", () => {
    render(<CalendarPlanner initialView="dag" tools={null} weekGoals={null} checkin={null} connection={null} onDateChange={write} />);
    fireEvent.click(screen.getByRole("button", { name: /Morgonrutin/ }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Ändra eller hoppa över idag" }));

    const save = dialog.getByRole("button", { name: "Spara bara idag" });
    expect(save).toBeEnabled();

    const field = dialog.getByLabelText("Tid för detta tillfälle");
    fireEvent.change(field, { target: { value: "" } });
    expect(save).toBeDisabled();

    fireEvent.change(field, { target: { value: "08:30" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(written.current).toEqual([
      expect.objectContaining({ routineId: "morgon", occurrenceDate: routine.occurrenceDate, status: "rescheduled", time: "08:30" }),
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
