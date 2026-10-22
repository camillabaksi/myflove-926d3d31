import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { FlowKnowledge } from "@/lib/flow-learning";

const state = {
  demo: false,
  knowledge: {
    level: 55,
    label: "Jag känner igen dina mönster",
    insights: [{ id: "mornings", text: "Dina morgnar brukar fungera.", confidence: "ser" }],
  } as FlowKnowledge,
  completed: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }],
  totalDays: 9,
};
const goBack = vi.fn();
const savedActions = vi.hoisted(() => ({ addTask: vi.fn(), addStrategy: vi.fn() }));
vi.mock("@/hooks/use-smart-back", () => ({ useSmartBack: () => goBack }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode }) => <a role="link" {...rest}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    history: { canGoBack: () => false, length: 1, back: vi.fn() },
    navigate: vi.fn(),
  }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { search: state.demo ? { demo: "1" } : {} } }),
}));
// Sidan renderas i appens delade skal; skalet testas separat.
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/hooks/use-data", () => ({
  useTasks: () => ({ addTask: savedActions.addTask, completedTasks: state.completed, tasks: state.completed }),
  useReminders: () => ({ reminders: [] }),
  useMoods: () => ({ moods: [], addMood: vi.fn(), setMoods: vi.fn() }),
}));
vi.mock("@/hooks/use-flowscore", () => ({ useFlowScore: () => ({ flow: { maxFriction: 5 } }) }));
vi.mock("@/hooks/use-insight", () => ({
  useInsightStrategies: () => ({
    saved: [],
    addStrategy: savedActions.addStrategy,
    removeStrategy: vi.fn(),
    hasStrategy: () => false,
  }),
}));
vi.mock("@/hooks/use-flow-learning", () => ({ useFlowLearning: () => state.knowledge }));
vi.mock("@/hooks/use-visit-streak", () => ({
  useVisitStreak: () => ({ totalDays: state.totalDays }),
}));
vi.mock("@/hooks/use-is-admin", () => ({
  useIsAdmin: () => ({ isAdmin: state.demo, loading: false }),
}));
vi.mock("@/lib/storage", () => ({
  useLocalStorage: (_k: string, init: unknown) => [init, vi.fn()],
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

const { default: InsightPage } = await import("@/pages/insight");

beforeEach(() => {
  goBack.mockClear();
  savedActions.addTask.mockClear();
  savedActions.addStrategy.mockClear();
  state.demo = false;
  state.totalDays = 9;
  state.knowledge = {
    level: 55,
    label: "Jag känner igen dina mönster",
    insights: [{ id: "mornings", text: "Dina morgnar brukar fungera.", confidence: "ser" }],
  };
});

describe("MyFlove Insight", () => {
  it("har separat navigation och en oklippt editorialrubrik i Paceables listbredd", () => {
    render(<InsightPage />);
    const header = screen.getByTestId("insight-header");
    const heading = within(header).getByRole("heading", { name: "Insikter", level: 1 });
    expect(heading.className).toContain("pace-editorial-role");
    expect(heading.className).not.toMatch(/truncate|nowrap|line-clamp/);
    expect(header.closest(".pace-ds-content-list")).toBeTruthy();
    expect(within(header).queryByText("MyFlove Insight")).toBeNull();
    const back = within(header).getByRole("button", { name: "Tillbaka" });
    expect(back.className).toContain("pace-ds-button");
    fireEvent.click(back);
    expect(goBack).toHaveBeenCalledOnce();
    const today = within(header).getByRole("link", { name: "Till Idag" });
    expect(today.getAttribute("to")).toBe("/idag");
    expect(today.className).toContain("pace-ds-button");
  });

  it("behåller den befintliga frivilliga förklaringen under rubriken", () => {
    render(<InsightPage />);
    const header = screen.getByTestId("insight-header");
    const why = within(header).getByRole("button", { name: /Varför/ });
    expect(why.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(why);
    expect(within(header).getByText(/När du loggar över tid kan Pace hjälpa dig/)).toBeTruthy();
  });

  it("visar den inloggade användarens egna insikter", () => {
    render(<InsightPage />);
    expect(screen.getByTestId("insight-personal")).toBeTruthy();
    expect(screen.getByText("Dina morgnar brukar fungera.")).toBeTruthy();
    expect(screen.queryByTestId("insight-empty")).toBeNull();
  });

  it("visar viktigaste underbyggda observationen först utan nivåpoäng", () => {
    state.knowledge = {
      level: 65,
      label: "Jag börjar lära känna dina mönster",
      insights: [
        { id: "energy", text: "Ett första energimönster.", confidence: "börjar" },
        { id: "mornings", text: "En återkommande morgonobservation.", confidence: "ser" },
        { id: "postponed", text: "Ett starkare mönster.", confidence: "vet" },
      ],
    };
    render(<InsightPage />);
    const observations = screen.getByTestId("insight-observations");
    expect(within(observations).getByText("Ett starkare mönster.")).toBeTruthy();
    expect(within(observations).getByText(/Flera registreringar pekar åt samma håll/)).toBeTruthy();
    expect(screen.queryByText("Ett första energimönster.")).toBeNull();
    expect(screen.queryByText("En återkommande morgonobservation.")).toBeNull();
    expect(screen.queryByText(/Balken speglar hur mycket underlag/)).toBeNull();
    const more = screen.getByRole("button", { name: "Fler observationer" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(screen.getByText("En återkommande morgonobservation.")).toBeTruthy();
    expect(screen.getByText("Ett första energimönster.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Förslag att prova" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("låter användaren välja fördjupning utan att behöva öppna diagram", () => {
    render(<InsightPage />);
    expect(screen.getByText("Trender och fördjupning")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Energipåverkan & mående" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "Batteri & aktivitetstid" }).getAttribute("aria-expanded")).toBe("false");
    const basis = screen.getByRole("button", { name: "Mitt underlag" });
    expect(basis.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(basis);
    expect(screen.getByText("Avslutade uppgifter")).toBeTruthy();
    expect(screen.getByText(/antal registreringar, inte ett betyg/)).toBeTruthy();
  });

  it("visar ett enda valfritt litet steg utan att skapa något vid förhandsvisning", () => {
    render(<InsightPage />);
    expect(screen.getByText("Dina morgnar brukar fungera.")).toBeTruthy();
    const show = screen.getByRole("button", { name: "Visa ett litet steg att prova" });
    expect(show.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTestId("insight-support-preview")).toBeNull();
    fireEvent.click(show);
    const preview = screen.getByTestId("insight-support-preview");
    expect(within(preview).getByText("Gör tiden synlig med timer")).toBeTruthy();
    expect(within(preview).getByText(/Inget läggs till förrän du väljer det/)).toBeTruthy();
    expect(savedActions.addTask).not.toHaveBeenCalled();
    expect(savedActions.addStrategy).not.toHaveBeenCalled();
    fireEvent.click(within(preview).getByRole("button", { name: "Inte nu" }));
    expect(screen.queryByTestId("insight-support-preview")).toBeNull();
    expect(savedActions.addTask).not.toHaveBeenCalled();
  });

  it("kräver separat bekräftelse innan ett frivilligt stöd sparas som uppgift", () => {
    render(<InsightPage />);
    fireEvent.click(screen.getByRole("button", { name: "Visa ett litet steg att prova" }));
    fireEvent.click(within(screen.getByTestId("insight-support-preview")).getByRole("button", { name: "Välj hur du vill använda det" }));
    expect(screen.getByRole("dialog", { name: "Var vill du använda den?" })).toBeTruthy();
    expect(savedActions.addTask).not.toHaveBeenCalled();
    const firstDialog = within(screen.getByRole("dialog"));
    fireEvent.click(firstDialog.getByRole("button", { name: "Inte nu" }));
    expect(savedActions.addTask).not.toHaveBeenCalled();
    expect(savedActions.addStrategy).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId("insight-support-preview")).getByRole("button", { name: "Välj hur du vill använda det" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Lägg till som uppgift utan påminnelser" }));
    expect(savedActions.addTask).toHaveBeenCalledTimes(1);
    expect(savedActions.addTask).toHaveBeenCalledWith("Gör tiden synlig med timer", undefined,
      expect.objectContaining({ kind: "uppgift", steps: [] }));
    expect(savedActions.addStrategy).toHaveBeenCalledTimes(1);
    expect(savedActions.addStrategy).toHaveBeenCalledWith(expect.objectContaining({
      strategyId: "time-visible", areaId: "tid",
    }));
  });

  it("sparar strategi som frivilligt stöd utan att lägga till en uppgift idag", () => {
    render(<InsightPage />);
    fireEvent.click(screen.getByRole("button", { name: "Visa ett litet steg att prova" }));
    fireEvent.click(within(screen.getByTestId("insight-support-preview")).getByRole("button", { name: "Välj hur du vill använda det" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("Ingen uppgift och ingen påminnelse skapas.")).toBeTruthy();
    fireEvent.click(dialog.getByRole("button", { name: "Spara som frivilligt stöd" }));
    expect(savedActions.addStrategy).toHaveBeenCalledOnce();
    expect(savedActions.addStrategy).toHaveBeenCalledWith(expect.objectContaining({
      strategyId: "time-visible",
      areaId: "tid",
      nudges: [],
    }));
    expect(savedActions.addTask).not.toHaveBeenCalled();
  });

  it("visar inget handlingsförslag utan en känd personlig observation", () => {
    state.totalDays = 1;
    state.completed = [];
    state.knowledge = { level: 0, label: "För lite underlag", insights: [] };
    render(<InsightPage />);
    expect(screen.queryByRole("button", { name: "Visa ett litet steg att prova" })).toBeNull();
    expect(savedActions.addTask).not.toHaveBeenCalled();
  });

  it("visar ett lugnt tomläge när underlaget saknas", () => {
    state.totalDays = 1;
    state.completed = [];
    state.knowledge = { level: 5, label: "Vi har precis lärt känna varandra", insights: [] };
    render(<InsightPage />);
    expect(screen.getByTestId("insight-empty")).toBeTruthy();
    state.completed = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }];
  });

  it("läcker inte testprofiler i normalt användarläge", () => {
    render(<InsightPage />);
    expect(screen.queryByText(/exempelprofil/i)).toBeNull();
    expect(screen.queryByText(/Skapa en egen testprofil/i)).toBeNull();
    expect(screen.queryByText(/Fiktivt underlag/i)).toBeNull();
    expect(screen.queryByTestId("insight-open-demo")).toBeNull();
  });

  it("visar testprofiler endast i explicit demoläge", () => {
    state.demo = true;
    render(<InsightPage />);
    expect(screen.getByText(/Demoläge/)).toBeTruthy();
    expect(screen.getByText(/Prova med en exempelprofil/i)).toBeTruthy();
    expect(screen.queryByTestId("insight-personal")).toBeNull();
  });
});
