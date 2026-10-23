import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanningWorkspace } from "./planning-workspace";
import PlanningPage from "@/pages/planning";
import { StrictMode, type ReactNode } from "react";
import { setCollapsed } from "@/lib/collapse-store";
import { clearPlanningHandoffs } from "@/lib/planning-handoff";
import { todayISO } from "@/lib/day";

const model = vi.hoisted(() => ({
  owner: "owner",
  audience: "me" as "me" | "children",
  period: "today" as "today" | "tomorrow" | "week",
  addTasks: vi.fn(),
  addChildren: vi.fn(),
  syncUser: vi.fn(),
  navigate: vi.fn(),
  supports: [] as Array<{id:string;strategyId:string;title:string;areaId:"tid";contexts:["vardag"];friction:number;minutes:number;nudges:[];addedAt:number}>,
  existing: {} as Record<string, Array<{ id: string; title: string; date: string; source: "task"; time: string }>>,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, ...props }: { children: ReactNode; to: string; search?: unknown }) => (
    <a href={to} data-route-search={JSON.stringify(search ?? null)} {...props}>
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
  useVisualCalendar: () => ({ days: model.existing, planningReady: true, planningError: false }),
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
  model.existing = {};
  setCollapsed(`${window.location.pathname}::optional-saved-strategies`, true, true);
  model.addTasks.mockReset();
  model.addChildren.mockReset().mockResolvedValue(undefined);
  model.syncUser.mockReset().mockResolvedValue({ id: "owner" });
});
const write = (text: string) =>
  fireEvent.change(screen.getByRole("textbox", { name: "Vad vill du planera?" }), {
    target: { value: text },
  });

describe("Compact calendar context", () => {
  it("shows an empty-plan message without a redundant large heading and date card", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    const existing = screen.getByRole("region", { name: "Redan i planen" });
    expect(within(existing).getByText("Inget inplanerat här ännu.")).toBeTruthy();
    expect(existing.querySelector("h2")).toBeNull();
    expect(existing.className).toContain("px-1 py-1");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("keeps the existing-plan list available without changing typed tasks", () => {
    const date = todayISO();
    model.existing = { [date]: [{ id: "a", title: "Tandläkaren", date, source: "task", time: "11:00" }] };
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla");
    const existing = screen.getByRole("region", { name: "Redan i planen" });
    expect(within(existing).getByRole("heading", { name: "Redan i planen (1)" })).toBeTruthy();
    expect(within(existing).getByText("Tandläkaren")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Handla");
    expect(model.addTasks).not.toHaveBeenCalled();
  });
});

describe("Plan several activities before saving", () => {
  it("uses Calendar's chosen date for a week plan without creating any activity", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" requestedDate="2026-11-18" />);
    const selectedDay = within(screen.getByRole("group", { name: "Veckans dagar" }))
      .getByRole("button", { name: /ons.*18/i });
    expect(selectedDay).toHaveAttribute("aria-pressed", "true");
    write("Handla\nSimskola");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("preserves an unfinished Calendar-date draft instead of silently moving it", () => {
    const page = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" requestedDate="2026-11-18" />);
    write("Studera");
    page.rerender(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" requestedDate="2026-11-22" />);
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getByLabelText("Dag")).toHaveValue("2026-11-18");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("reveals an invalid collapsed review row and prevents saving", async () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla\nTvätta");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    const first = screen.getByTestId("planning-review-row-0");
    fireEvent.click(first.querySelector("summary")!);
    fireEvent.change(within(first).getByRole("textbox", { name: "Aktivitet 1" }), { target: { value: "" } });
    fireEvent.click(first.querySelector("summary")!);
    expect(first).not.toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Kontrollera aktivitet, datum, tid och plats.");
    expect(first).toHaveAttribute("open");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("shows a concise date and recipient overview before a multi-activity save", () => {
    render(<PlanningWorkspace owner="owner" audience="children" requestedPeriod="today" />);
    write("Frukost\nSimskola");
    fireEvent.click(screen.getByRole("checkbox", { name: "Bella" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Bianca" }));
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));

    const first = screen.getByTestId("planning-review-row-0");
    const second = screen.getByTestId("planning-review-row-1");
    expect(first).not.toHaveAttribute("open");
    expect(second).not.toHaveAttribute("open");
    expect(within(first).getByText("Frukost")).toBeTruthy();
    expect(within(second).getByText("Simskola")).toBeTruthy();
    expect(within(first).getByText("Bella, Bianca")).toBeTruthy();
    expect(within(first).getByText(/\d{4}/)).toBeTruthy();
    expect(model.addChildren).not.toHaveBeenCalled();

    fireEvent.click(first.querySelector("summary")!);
    expect(first).toHaveAttribute("open");
    expect(within(first).getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Frukost");
    expect(model.addChildren).not.toHaveBeenCalled();
  });

  it("shows activity input before child recipients without extra steps", () => {
    render(<PlanningWorkspace owner="owner" audience="children" requestedPeriod="today" />);
    const field = screen.getByRole("textbox", { name: "Vad vill du planera?" });
    const bella = screen.getByRole("checkbox", { name: "Bella" });
    expect(field.compareDocumentPosition(bella) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: /Granska aktiviteter/ })).toBeDisabled();
    write("Simskola");
    expect(field).toHaveValue("Simskola");
    fireEvent.click(bella);
    expect(screen.getByRole("button", { name: /Granska aktiviteter/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getByRole("heading", { name: "Så här blir din plan" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Simskola");
    expect(model.addChildren).not.toHaveBeenCalled();
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("starts with two existing items on mobile, reveals the rest on request, and never changes the draft", () => {
    const date = todayISO();
    model.existing = {
      [date]: Array.from({ length: 5 }, (_, index) => ({
        id: `item-${index}`, title: `Befintlig aktivitet ${index + 1}`, date,
        source: "task" as const, time: `1${index}:00`,
      })),
    };
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("heading", { name: "Redan i planen (5)" })).toBeTruthy();
    const existing = screen.getByRole("region", { name: "Redan i planen" });
    const entries = within(existing).getAllByRole("listitem");
    expect(entries).toHaveLength(5);
    expect(entries.slice(0, 2).every(entry => !entry.className.includes("hidden"))).toBe(true);
    expect(entries.slice(2).every(entry => entry.className.includes("hidden lg:grid"))).toBe(true);

    const expand = within(existing).getByRole("button", { name: "Visa alla 5" });
    expect(expand.className).toContain("lg:hidden");
    expect(expand).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand);
    expect(entries.every(entry => !entry.className.includes("hidden lg:grid"))).toBe(true);
    fireEvent.click(within(existing).getByRole("button", { name: "Visa färre" }));
    expect(entries.slice(2).every(entry => entry.className.includes("hidden lg:grid"))).toBe(true);
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("does not add a second explanatory paragraph after the save button for personal tasks", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getByRole("button", { name: /Spara aktiviteter/ })).toBeTruthy();
    expect(screen.queryByText("Alla läggs till när du trycker på Spara.")).toBeNull();
  });

  it("shows one compact seven-day picker before the input without seven tall day rows", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" />);
    const picker = screen.getByRole("group", { name: "Veckans dagar" });
    expect(picker.className).toContain("grid-cols-4");
    expect(picker.className).toContain("min-[390px]:grid-cols-7");
    const days = within(picker).getAllByRole("button");
    expect(days).toHaveLength(7);
    expect(days.every((day) => day.getAttribute("aria-label")?.includes("planerade aktiviteter"))).toBe(true);
    expect(within(picker).queryByText("Inget planerat")).toBeNull();
    fireEvent.click(days[2]!);
    expect(days[2]).toHaveAttribute("aria-pressed", "true");
    write("Studera");
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Studera");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("shows the real editable dates during review without misleading week or period selectors", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" />);
    const days = within(screen.getByRole("group", { name: "Veckans dagar" })).getAllByRole("button");
    fireEvent.click(days[2]!);
    write("Studera\\nHandla".replace("\\n", "\n"));
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));

    expect(screen.getByRole("heading", { name: "Så här blir din plan" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Veckans dagar" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Välj planeringsperiod" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nästa vecka" })).toBeNull();
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    expect(screen.getAllByLabelText("Dag")).toHaveLength(2);
    fireEvent.change(screen.getAllByLabelText("Dag")[0]!, { target: { value: "2026-11-18" } });
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");

    fireEvent.click(screen.getByRole("button", { name: "Ändra listan" }));
    expect(screen.getByRole("group", { name: "Veckans dagar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Veckan" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("offers joint family planning as one quiet, optional control", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("button", { name: "Även för barnen" })).toBeTruthy();
    expect(screen.queryByText("Planera för mig")).toBeNull();
    expect(screen.queryByText("Vilka barn gäller det?")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Även för barnen" }));
    expect(screen.getByText("För mig och barnen")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Bella" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bara mig" }));
    expect(screen.queryByText("Vilka barn gäller det?")).toBeNull();
    expect(model.addTasks).not.toHaveBeenCalled();
    expect(model.addChildren).not.toHaveBeenCalled();
  });

  it("shows review dates immediately but keeps time, location and area optional", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla\\nPromenad".replace("\\n", "\n"));
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.getAllByLabelText("Dag")).toHaveLength(2);
    const optional = screen.getByTestId("planning-optional-0");
    const nextOptional = screen.getByTestId("planning-optional-1");
    expect(optional).not.toHaveAttribute("open");
    expect(nextOptional).not.toHaveAttribute("open");
    fireEvent.click(within(optional).getByText(/Fler val/));
    expect(optional).toHaveAttribute("open");
    expect(within(optional).getByRole("combobox", { name: "Område · Handla" })).toBeTruthy();
    fireEvent.change(within(optional).getByLabelText("Start · frivilligt"), { target: { value: "10:30" } });
    fireEvent.change(within(optional).getByLabelText("Plats · frivilligt"), { target: { value: "Butiken" } });
    expect(optional).toHaveTextContent("Ifyllt");
    expect(nextOptional).not.toHaveAttribute("open");
    expect(model.addTasks).not.toHaveBeenCalled();
  });

  it("keeps multi-day dates visible and hides irrelevant time inputs", () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Kurs");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    const optional = screen.getByTestId("planning-optional-0");
    expect(optional).not.toHaveAttribute("open");
    // Closed <details> keeps its input in the DOM but does not show it visually.
    // Assert the native open state, not whether jsdom exposes the descendant role.
    fireEvent.click(within(optional).getByText(/Fler val/));
    fireEvent.click(within(optional).getByRole("checkbox", { name: "Pågår flera dagar" }));
    expect(screen.getByLabelText("Från")).toBeTruthy();
    expect(screen.getByLabelText("Till och med")).toBeTruthy();
    expect(optional).toHaveTextContent("Ifyllt");
    expect(within(optional).queryByLabelText("Start · frivilligt")).toBeNull();
    expect(within(optional).getByLabelText("Plats · frivilligt")).toBeTruthy();
  });

  it("restores the unsaved review and edited date after leaving for Insights and returning", () => {
    const visit = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    write("Handla\nBoka tid");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    fireEvent.change(screen.getAllByLabelText("Dag")[0]!, { target: { value: "2026-11-18" } });
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    visit.unmount(); // Navigate to Insights; Planera is no longer mounted.
    expect(model.addTasks).not.toHaveBeenCalled();

    const back = render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    expect(screen.getByRole("heading", { name: "Så här blir din plan" })).toBeTruthy();
    expect(within(screen.getByTestId("planning-review-row-0")).getByText(/18 nov/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    expect(screen.getAllByLabelText("Dag")[0]).toHaveValue("2026-11-18");
    expect(screen.getByRole("textbox", { name: "Aktivitet 1" })).toHaveValue("Handla");
    expect(model.addTasks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ändra listan" }));
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Handla\nBoka tid");
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
    expect(screen.queryByRole("group", { name: "Välj planeringsperiod" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Veckans dagar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ändra listan" }));
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

  it("offers a dated way back to Calendar only after a confirmed save", async () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" requestedDate="2026-11-18" />);
    expect(screen.queryByRole("link", { name: /Visa i kalendern/ })).not.toBeInTheDocument();
    write("Handla");
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    expect(screen.queryByRole("link", { name: /Visa i kalendern/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    const link = await screen.findByRole("link", { name: "Visa i kalendern" });
    expect(link).toHaveAttribute("href", "/kalender");
    expect(JSON.parse(link.getAttribute("data-route-search") || "null")).toEqual({ view: "dag", date: "2026-11-18" });
    expect(model.addTasks).toHaveBeenCalledTimes(1);
    write("Boka tid");
    expect(screen.queryByRole("link", { name: /Visa i kalendern/ })).not.toBeInTheDocument();
  });

  it("shows the first saved date rather than today's date when a batch spans days", async () => {
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="week" requestedDate="2026-11-18" />);
    write("Handla\\nSimskola".replace("\\n", "\n"));
    fireEvent.click(screen.getByRole("button", { name: /Granska aktiviteter/ }));
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    fireEvent.change(screen.getAllByLabelText("Dag")[0]!, { target: { value: "2026-11-19" } });
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    const link = await screen.findByRole("link", { name: "Visa första datumet i kalendern" });
    expect(JSON.parse(link.getAttribute("data-route-search") || "null")).toEqual({ view: "dag", date: "2026-11-18" });
    expect(model.addTasks).toHaveBeenCalledTimes(1);
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

  it("keeps Granska aktiviteter before optional saved supports on the mobile planning form", () => {
    model.supports = [{
      id: "s1", strategyId: "time-visible", title: "Gör tiden synlig", areaId: "tid",
      contexts: ["vardag"], friction: 2, minutes: 5, nudges: [], addedAt: 1,
    }];
    render(<PlanningWorkspace owner="owner" audience="me" requestedPeriod="today" />);
    const review = screen.getByRole("button", { name: /Granska aktiviteter/ });
    const supports = screen.getByRole("button", { name: "Mina stöd" });
    expect(review.compareDocumentPosition(supports) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(supports).toHaveAttribute("aria-expanded", "false");
    write("Handla");
    expect(review).toBeEnabled();
    expect(model.addTasks).not.toHaveBeenCalled();
    fireEvent.click(supports);
    expect(screen.getByRole("button", { name: "Ta med i utkastet" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vad vill du planera?" })).toHaveValue("Handla");
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
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
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
    expect(within(screen.getByTestId("planning-review-row-0")).getByText("Bella, Bianca")).toBeTruthy();
    expect(within(screen.getByTestId("planning-review-row-1")).getByText("Bella, Bianca")).toBeTruthy();
    fireEvent.click(screen.getByTestId("planning-review-row-0").querySelector("summary")!);
    fireEvent.click(screen.getByRole("button", { name: /Spara aktiviteter/ }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("link", { name: /Visa i kalendern/ })).not.toBeInTheDocument();
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
