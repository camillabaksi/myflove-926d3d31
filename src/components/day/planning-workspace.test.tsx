import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanningWorkspace } from "./planning-workspace";
import PlanningPage from "@/pages/planning";

const model = vi.hoisted(() => ({
  owner: "owner",
  audience: "me" as "me" | "children",
  period: "today" as "today" | "tomorrow" | "week",
  addTasks: vi.fn(),
  addChildren: vi.fn(),
  syncUser: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => model.navigate,
  useSearch: () => ({ audience: model.audience, period: model.period }),
}));
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: model.owner } }) }));
vi.mock("@/components/layout", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("@/hooks/use-language", () => ({
  useLang: () => ({ t: (text: string) => text, locale: "sv-SE" }),
}));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ addPlannedTasks: model.addTasks }) }));
vi.mock("@/hooks/use-children", () => ({
  useChildren: () => ({
    userId: model.owner,
    children: ["Bella", "Bianca"].map((name) => ({ id: name, name, owner_id: model.owner })),
    items: [],
    loading: false,
    error: null,
    addPlannedActivities: model.addChildren,
  }),
}));
vi.mock("@/hooks/use-visual-calendar", () => ({
  useVisualCalendar: () => ({ days: {}, planningReady: true, planningError: false }),
}));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => ({ percent: 42 }) }));
vi.mock("@/lib/life-areas", () => ({ useActiveArea: () => ({ activeArea: "alla" }) }));
vi.mock("@/lib/cloud-storage", () => ({
  getSyncUser: model.syncUser,
  useCloudSyncedStorage: (_key: string, initial: unknown) => [initial],
}));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (id: string) => id === model.owner }));
vi.mock("@/components/day/day-replan", () => ({
  DayReplanButton: () => <button>Få ihop dagen</button>,
}));

beforeEach(() => {
  model.owner = "owner";
  model.audience = "me";
  model.period = "today";
  model.addTasks.mockReset();
  model.addChildren.mockReset().mockResolvedValue(undefined);
  model.syncUser.mockReset().mockResolvedValue({ id: "owner" });
});
const write = (text: string) =>
  fireEvent.change(screen.getByRole("textbox", { name: "Vad vill du planera?" }), {
    target: { value: text },
  });

describe("Plan several activities before saving", () => {
  it("saves one reviewed personal batch and retains edited rows across period changes", async () => {
    const page = render(
      <PlanningWorkspace owner="owner" audience="me" requestedPeriod="tomorrow" />,
    );
    write("Handla\nTvätta\nPromenad");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(model.addTasks).not.toHaveBeenCalled();
    const dates = screen.getAllByLabelText("Dag");
    fireEvent.change(dates[0]!, { target: { value: "2026-11-01" } });
    page.rerender(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" />);
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-01");
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    await waitFor(() => expect(model.addTasks).toHaveBeenCalledTimes(1));
    expect(model.addTasks.mock.calls[0]![0]).toHaveLength(3);
    expect(model.addTasks.mock.calls[0]![0][0]).toMatchObject({
      title: "Handla",
      dueDate: "2026-11-01",
      completed: false,
    });
    expect(model.addChildren).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue(""),
    );
  });
  it("requires explicit children, preserves a failed batch and retries identical content", async () => {
    model.addChildren.mockRejectedValueOnce(Error("Nätverket svarar inte."));
    render(<PlanningWorkspace owner="owner" audience="children" requestedPeriod="today" />);
    write("Frukost\nSimskola");
    expect(screen.getByRole("button", { name: /Granska aktiviteter/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Bella" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Bianca" }));
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(
      screen
        .getAllByRole("checkbox", { name: "Bella" })
        .every((input) => (input as HTMLInputElement).checked),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    await screen.findByRole("alert");
    const first = structuredClone(model.addChildren.mock.calls[0]![0]);
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Frukost");
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Försök igen" }));
    await waitFor(() => expect(model.addChildren).toHaveBeenCalledTimes(2));
    expect(model.addChildren.mock.calls[1]![0]).toEqual(first);
    expect(model.addTasks).not.toHaveBeenCalled();
  });
  it("keeps separate audience drafts and clears them when the account changes", () => {
    const page = render(<PlanningPage />);
    const own = within(screen.getByRole("region", { name: "Planera i din takt" }));
    fireEvent.change(own.getByRole("textbox"), { target: { value: "Privat aktivitet" } });
    model.audience = "children";
    page.rerender(<PlanningPage />);
    const child = within(screen.getByRole("region", { name: "Planera barnens dagar" }));
    expect(child.getByRole("textbox")).toHaveValue("");
    fireEvent.change(child.getByRole("textbox"), { target: { value: "Barnens aktivitet" } });
    model.audience = "me";
    page.rerender(<PlanningPage />);
    expect(screen.getByRole("textbox")).toHaveValue("Privat aktivitet");
    model.owner = "different";
    page.rerender(<PlanningPage />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("does not write if the signed-in account changes during confirmation", async () => {
    let finish!: (value: unknown) => void;
    model.syncUser.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    model.owner = "different";
    await act(async () => finish({ id: "different" }));
    expect(model.addTasks).not.toHaveBeenCalled();
    expect(model.addChildren).not.toHaveBeenCalled();
  });
});
