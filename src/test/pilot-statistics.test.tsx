import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminStats, { PilotDashboard, pilotSnapshot } from "@/pages/admin-stats";
import { summarizePilotAccounts, summarizePilotUsage } from "@/lib/pilot-statistics";

const mock = vi.hoisted(() => ({ accounts: vi.fn(), usage: vi.fn(), clipboard: vi.fn(), admin: true }));
vi.mock("@/lib/user-funnel.functions", () => ({ getUserFunnelFn: mock.accounts }));
vi.mock("@/lib/pilot-statistics.functions", () => ({ getPilotUsageFn: mock.usage }));
vi.mock("@/hooks/use-is-admin", () => ({ useIsAdmin: () => ({ isAdmin: mock.admin, loading: false }) }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: ReactNode }) => <a>{children}</a> }));
vi.mock("@/components/admin/user-analytics", () => ({ default: () => <p>Raw audit</p> }));
vi.mock("@/components/admin/analytics-export", () => ({ default: () => null }));
vi.mock("@/components/collapsible-section", () => ({ default: ({ title, defaultCollapsed, children }: { title: string; defaultCollapsed?: boolean; children: ReactNode }) => <details open={!defaultCollapsed}><summary>{title}</summary>{children}</details> }));
const now = Date.parse("2026-10-15T12:00:00Z");
const accounts = { ...summarizePilotAccounts([], new Set(), now), active30d: 12, active7d: 8, newActive7d: 2 };
const usage = summarizePilotUsage([
  { session_id: "a", action: "task_created", created_at: "2026-10-13T12:00:00Z" },
  { session_id: "a", action: "task_completed", created_at: "2026-10-14T12:00:00Z" },
  { session_id: "b", action: "battery_checkin_completed", created_at: "2026-10-14T12:00:00Z" },
], [], now);
beforeEach(() => {
  vi.clearAllMocks(); mock.admin = true;
  mock.accounts.mockResolvedValue(accounts); mock.usage.mockResolvedValue(usage);
  mock.clipboard.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: mock.clipboard } });
});
function show(content: ReactNode = <PilotDashboard />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{content}</QueryClientProvider>);
}
describe("Concrete pilot overview", () => {
  it("shows separate account/browser units, explicit denominators and missing outcome evidence", async () => {
    show();
    await screen.findByText("50 %");
    expect(within(screen.getByRole("region", { name: "Aktiva konton" })).getByText("12")).toBeInTheDocument();
    const core = screen.getByRole("region", { name: "Kärnanvändning" });
    expect(within(core).getByText(/1 av 2 ID har gjort kärnhandlingar/)).toBeInTheDocument();
    expect(screen.getByText("Upplevd nytta · underlag saknas här")).toBeInTheDocument();
    expect(screen.getByText("Visa kontohistorik och avgränsning").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Granskning och export").closest("details")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Kopiera översikt att dela" }));
    await waitFor(() => expect(mock.clipboard).toHaveBeenCalledWith(pilotSnapshot(accounts, usage)));
    const shared = mock.clipboard.mock.calls[0][0] as string;
    expect(shared).toContain("12 senaste 30 dagarna");
    expect(shared).toContain("1 av 2 (50 %)");
    expect(shared).toContain("ID är inte personer");
    expect(shared).toContain("Användningsdata visar inte effekt");
    expect(shared).not.toContain("@");
  });
  it("shows unknown rates on no observations, without inventing zero benefit", async () => {
    mock.usage.mockResolvedValue(summarizePilotUsage([], [], now));
    show();
    await screen.findByText(/Inga kärnhandlingar har registrerats/);
    expect(screen.queryByText("0 %")).not.toBeInTheDocument();
    expect(screen.getByText("Upplevd nytta · underlag saknas här")).toBeInTheDocument();
  });
  it("keeps failed accounts independent of usable telemetry and disables sharing an incomplete report", async () => {
    mock.accounts.mockRejectedValue(new Error("unavailable"));
    show();
    await screen.findByRole("alert");
    await screen.findByText("50 %");
    expect(screen.queryByText("Aktiva · 30 dagar")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kopiera översikt att dela" })).toBeDisabled();
  });
  it("does not mount privileged queries for unauthorized visitors", () => {
    mock.admin = false;
    show(<AdminStats />);
    expect(screen.getByText("Endast för grundaren")).toBeInTheDocument();
    expect(mock.accounts).not.toHaveBeenCalled(); expect(mock.usage).not.toHaveBeenCalled();
  });
});
