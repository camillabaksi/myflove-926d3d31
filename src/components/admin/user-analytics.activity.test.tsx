import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserAnalytics, SessionRow } from "@/lib/analytics-audit.functions";
import UserAnalyticsView from "./user-analytics";
const mock = vi.hoisted(() => ({ load: vi.fn(), mark: vi.fn(), unavailable: false }));
vi.mock("@/lib/analytics-audit.functions", () => ({ getUserAnalyticsFn: mock.load, setSessionInternalFn: mock.mark }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/analytics", () => ({ getAnalyticsSessionId: () => "my-browser" }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/components/collapsible-section", () => ({ default: ({ children }: { children: ReactNode }) => <section>{children}</section> }));
const session = (email: string): SessionRow => ({ email, sessionId: email, isInternal: false, userId: null, isAdmin: false, isDemo: false,
  events: 1, activeDays: 1, firstSeen: "2026-10-01T06:00:00Z", lastSeen: "2026-10-14T06:00:00Z" });
beforeEach(() => {
  vi.clearAllMocks(); mock.unavailable = false;
  mock.load.mockImplementation(async ({ data: { days } }): Promise<UserAnalytics> => ({
    activityDays: days, registeredUsers: 61, activeRegisteredUsers: mock.unavailable ? null : days === 30 ? 2 : 3,
    sessions: days === 30 ? [session("recent@example.test")] : [session("recent@example.test"), session("old@example.test")],
    totals: { events: 1, sessions: 1, internalEvents: 0, internalSessions: 0, externalEvents: 1, externalSessions: 1, unknownEvents: 0, unknownSessions: 0 },
  }));
});
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><UserAnalyticsView /></QueryClientProvider>);
}
describe("Recent activity audit", () => {
  it("shows recent accounts by default and loads older browsers only after opting into history", async () => {
    show();
    await screen.findByText("recent@example.test");
    expect(mock.load).toHaveBeenCalledWith({ data: { days: 30 } });
    expect(screen.queryByText("old@example.test")).not.toBeInTheDocument();
    expect(screen.queryByText("Registrerade konton")).not.toBeInTheDocument();
    expect(within(screen.getByText("Aktiva konton senaste 30 dagarna").parentElement!).getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Visa äldre aktivitet (upp till 400 dagar)" }));
    await screen.findByText("old@example.test");
    expect(mock.load).toHaveBeenCalledWith({ data: { days: 400 } });
    expect(screen.getByText("Aktiva konton under historikperioden")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Visa äldre aktivitet (upp till 400 dagar)" }));
    await waitFor(() => expect(screen.queryByText("old@example.test")).not.toBeInTheDocument());
  });
  it("does not present missing account activity as zero active accounts", async () => {
    mock.unavailable = true;
    show();
    await screen.findByText("recent@example.test");
    expect(within(screen.getByText("Aktiva konton senaste 30 dagarna").parentElement!).getByText("—")).toBeInTheDocument();
  });
});
