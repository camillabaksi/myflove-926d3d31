import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanningWorkspace } from "./planning-workspace";
import PlanningPage from "@/pages/planning";
import { StrictMode, type ReactNode } from "react";
import { setCollapsed } from "@/lib/collapse-store";
import { clearPlanningHandoffs } from "@/lib/planning-handoff";

const model = vi.hoisted(() => ({
  owner: "owner",
  audience: "me" as "me" | "children",
  period: "today" as "today" | "tomorrow" | "week",
  addTasks: vi.fn(),
  addChildren: vi.fn(),
  syncUser: vi.fn(),
  navigate: vi.fn(),
  supports: [] as Array<{id:string;strategyId:string;title:string;areaId:"tid";contexts:["vardag"];friction:number;minutes:number;nudges:[];addedAt:number}>,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search: _search, ...props }: { children: ReactNode; to: string; search?: unknown }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => model.navigate,
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: window.location.pathname } }),
  useSearch: () => ({ audience: model.audience, period: model.period }),
}));
vi.mock("@clerk/react", () => ({ useUser: () => ({ user: { id: model.owner } }) }));
vi.mock("@/hooks/use-insight", () => ({ useInsightStrategies: () => ({ saved: model.supports }) }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/hooks/use-language", () => ({
  useLang: () => ({ t: (text: string) => text, locale: "sv-SE" }),
}));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ addPlannedTasks: model.addTasks }), useReminders: () => ({ addPlannedPeriods: vi.fn() }) }));
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
vi.mock("@/lib/life-areas", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/life-areas")>(), useActiveArea: () => ({ activeArea: "alla" }) }));
vi.mock("@/lib/cloud-storage", () => ({
  getSyncUser: model.syncUser,
  useCloudSyncedStorage: (_key: string, initial: unknown) => [initial],
}));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: (id: string) => id === model.owner }));
vi.mock("@/components/day/day-replan", () => ({
  DayReplanButton: () => <button>Få ihop dagen</button>,
}));

beforeEach(() => {
  clearPlanningHandoffs();
  model.owner = "owner";
  model.audience = "me";
  model.period = "today";
  model.supports = [];
  setCollapsed(`${window.location.pathname}::optional-saved-strategies`, true, true);
  model.addTasks.mockReset();
  model.addChildren.mockReset().mockResolvedValue(undefined);
  model.syncUser.mockReset().mockResolvedValue({ id: "owner" });
});
const write = (text: string) =>
  fireEvent.change(screen.getByRole("textbox", { name: "Vad vill du planera?" }), {
    target: { value: text },
  });

describe("Plan several activities before saving", () => {
  it("restores the unsaved review and edited date after leaving for Insights and returning", () => {
    const visit = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla\\nBoka tid");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.change(screen.getAllByLabelText("Dag")[0]!, { target: { value: "2026-11-18" } });
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    visit.unmount(); // Navigate to Insights; Planera is no longer mounted.
    expect(model.addTasks).not.toHaveBeenCalled();

    const back = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("heading", { name: "Så här blir din plan" })).toBeTruthy();
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Handla");
    expect(model.addTasks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ändra listan" }));
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Handla\\nBoka tid");
    expect(model.addTasks).not.toHaveBeenCalled();
    back.unmount();
  });

  it("retains a chosen planning period and child recipients across the navigation round trip", () => {
    const visit = render(<PlanningWorkspace owner="owner" audience="children" requestedPeriod="week" />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Bella" }));
    write("Skolutflykt");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getByRole("checkbox", { name: "Bella" })).toBeChecked();
    visit.unmount();

    render(<PlanningWorkspace owner="owner" audience="children" requestedPeriod="today" />);
    expect(screen.getByRole("heading", { name: "Så här blir din plan" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Skolutflykt");
    expect(screen.getByRole("checkbox", { name: "Bella" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Veckan" })).toHaveAttribute("aria-pressed", "true");
    expect(model.addChildren).not.toHaveBeenCalled();
  });

  it("restores a week selection even when React StrictMode runs setup twice", () => {
    const first = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" />);
    write("Tvätta");
    first.unmount();
    render(<StrictMode><PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" /></StrictMode>);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Tvätta");
    expect(screen.getByRole("button", { name: "Veckan" })).toHaveAttribute("aria-pressed", "true");
    // URL still says "today"; selecting "Idag" must nevertheless work.
    fireEvent.click(screen.getByRole("button", { name: "Idag" }));
    expect(screen.getByRole("button", { name: "Idag" })).toHaveAttribute("aria-pressed", "true");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("drops successfully saved drafts rather than resurrecting them on a later visit", async () => {
    const first = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Liten promenad");
    first.unmount();
    const returned = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Liten promenad");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    await waitFor(() => expect(model.addTasks).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue(""));
    returned.unmount();

    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("");
    expect(model.addTasks).toHaveBeenCalledTimes(1);
  });

  it("never hands a personal draft to another account or revives it on switching back", () => {
    const first = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Privat text");
    first.unmount();

    model.owner = "different";
    const other = render(<PlanningWorkspace owner="different" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("");
    other.unmount();
    model.owner = "owner";
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("opens saved supports immediately after an explicit navigation from Today", () => {
    model.supports = [{
      id: "s1", strategyId: "time-visible", title: "Gör tiden synlig", areaId: "tid",
      contexts: ["vardag"], friction: 2, minutes: 5, nudges: [], addedAt: 1,
    }];
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" revealSupports />);
    expect(screen.getByRole("button", { name: "Mina stöd" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Ta med i utkastet" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("only turns a saved Insight support into a task after the Planera review and save", async () => {
    model.supports = [{ id:"s1", strategyId:"time-visible", title:"Gör tiden synlig", areaId:"tid",
      contexts:["vardag"], friction:2, minutes:5, nudges:[], addedAt:1 }];
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    const supports = screen.getByRole("button", { name: "Mina stöd" });
    expect(supports).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(supports);
    expect(model.addTasks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ta med i utkastet" }));
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Gör tiden synlig");
    expect(model.addTasks).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Finns i utkastet" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(model.addTasks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    await waitFor(() => expect(model.addTasks).toHaveBeenCalledTimes(1));
    expect(model.addTasks.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Gör tiden synlig", completed: false }),
    ]));
  });

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
    const own = within(screen.getByRole("region", { name: "Lägg till aktiviteter" }));
    fireEvent.change(own.getByRole("textbox"), { target: { value: "Privat aktivitet" } });
    model.audience = "children";
    page.rerender(<PlanningPage />);
    const child = within(screen.getByRole("region", { name: "Lägg till aktiviteter" }));
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
