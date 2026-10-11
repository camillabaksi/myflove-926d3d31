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
  useTasks: () => ({ addTask: vi.fn(), completedTasks: state.completed, tasks: state.completed }),
  useReminders: () => ({ reminders: [] }),
  useMoods: () => ({ moods: [], addMood: vi.fn(), setMoods: vi.fn() }),
}));
vi.mock("@/hooks/use-flowscore", () => ({ useFlowScore: () => ({ flow: { maxFriction: 5 } }) }));
vi.mock("@/hooks/use-insight", () => ({
  useInsightStrategies: () => ({
    saved: [],
    addStrategy: vi.fn(),
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
    const home = within(header).getByRole("link", { name: "Till hem" });
    expect(home.getAttribute("to")).toBe("/hem");
    expect(home.className).toContain("pace-ds-button");
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
