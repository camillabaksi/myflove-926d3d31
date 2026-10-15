import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUserRow } from "@/lib/admin.functions";
import { UsersSection } from "./admin";

const mock = vi.hoisted(() => ({ listUsers: vi.fn(), grant: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/admin.functions", () => ({ listUsersWithRolesFn: mock.listUsers, grantRoleFn: mock.grant, revokeRoleFn: mock.revoke,
  listAllFrictionItemsFn: vi.fn(), updateFrictionStatusFn: vi.fn(), deleteFrictionItemFn: vi.fn() }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-is-admin", () => ({ useIsAdmin: () => ({ isAdmin: true, loading: false }) }));
vi.mock("@/components/layout", () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/changelog-export", () => ({ default: () => null }));
vi.mock("@/components/admin/user-analytics", () => ({ default: () => null }));
vi.mock("@/components/admin/investor-docs", () => ({ default: () => null }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: ReactNode }) => <a>{children}</a> }));
const platforms = ["ios", "android", "web", "unknown"] as const;
const rows: AdminUserRow[] = platforms.map(platform => ({
  user_id: platform, registration_platform: platform, name: `Testkonto ${platform}`, email: `${platform}@example.test`,
  created_at: "2026-10-15T12:00:00Z", last_sign_in_at: null, last_visit_at: new Date(Date.now() - 1000).toISOString(), visits: 0, roles: [],
}));
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><UsersSection /></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); mock.listUsers.mockResolvedValue(rows); });
describe("Admin registration platform breakdown", () => {
  it("shows totals and filters both mobile cards and desktop rows without changing roles", async () => {
    show();
    await screen.findByRole("button", { name: "Alla plattformar · 4" });
    expect(screen.getByRole("button", { name: "1 iOS-appen" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "1 iOS-appen" }));
    expect(screen.getByRole("button", { name: "1 iOS-appen" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("Testkonto ios")).toHaveLength(2); // separate mobile/desktop renderings
    expect(screen.queryByText("Testkonto android")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1 Okänd" }));
    expect(screen.getAllByText("Testkonto unknown")).toHaveLength(2);
    expect(screen.queryByText("Testkonto ios")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Alla plattformar · 4" }));
    for (const row of rows) expect(screen.getAllByText(row.name!)).toHaveLength(2);
    expect(mock.grant).not.toHaveBeenCalled();
    expect(mock.revoke).not.toHaveBeenCalled();
  });
  it("recalculates counts with the existing date filter and can reset an empty platform selection", async () => {
    mock.listUsers.mockImplementation(args => Promise.resolve(args?.data?.from ? [rows[1]] : rows));
    const view = show();
    await screen.findByRole("button", { name: "Alla plattformar · 4" });
    fireEvent.click(screen.getByRole("button", { name: "1 iOS-appen" }));
    fireEvent.change(view.container.querySelector('input[type="date"]')!, { target: { value: "2026-10-15" } });
    await screen.findByRole("button", { name: "Alla plattformar · 1" });
    expect(screen.getByText("Inga användare med valda filter.")).toBeInTheDocument();
    expect(screen.queryByText("Testkonto ios")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Alla plattformar · 1" }));
    expect(screen.getAllByText("Testkonto android")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Rensa filter" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Alla plattformar · 4" })).toBeInTheDocument());
  });
  it("hides inactive and unobserved accounts from the platform counts until explicitly included", async () => {
    const extra = [{ ...rows[0], user_id: "inactive", name: "Gammalt konto", last_visit_at: "2020-01-01T12:00:00Z" },
      { ...rows[0], user_id: "unobserved", name: "Ingen aktivitet", last_visit_at: null }];
    mock.listUsers.mockResolvedValue([...rows, ...extra]);
    show();
    await screen.findByRole("button", { name: "Alla plattformar · 4" });
    expect(screen.queryByText("Gammalt konto")).not.toBeInTheDocument();
    expect(screen.queryByText("Ingen aktivitet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Visa även inaktiva konton" }));
    expect(screen.getByRole("button", { name: "Alla plattformar · 6" })).toBeInTheDocument();
    expect(screen.getAllByText("Gammalt konto")).toHaveLength(2);
    expect(screen.getAllByText("Ingen aktivitet")).toHaveLength(2);
    fireEvent.click(screen.getByRole("checkbox", { name: "Visa även inaktiva konton" }));
    expect(screen.getByRole("button", { name: "Alla plattformar · 4" })).toBeInTheDocument();
  });
});
