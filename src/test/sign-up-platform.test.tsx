import type { ComponentType } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/sign-up";

const mock = vi.hoisted(() => ({ signUp: vi.fn(), navigate: vi.fn(), track: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({}) }),
  useNavigate: () => mock.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: mock.signUp } } }));
vi.mock("@/lib/analytics", () => ({ track: mock.track }));
vi.mock("@/lib/backend-wake", () => ({ withBackendRecovery: (run: () => unknown) => run(), isBackendAsleepError: () => false }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/paceable/brand-logo", () => ({ BrandLogo: () => <span>Paceable</span> }));
vi.mock("@/components/pwa-install-button", () => ({ default: () => null }));

beforeEach(() => { vi.clearAllMocks(); mock.signUp.mockResolvedValue({ error: null }); });
afterEach(() => vi.unstubAllGlobals());
const SignUp = Route.options.component as ComponentType;

describe("Registration origin", () => {
  it.each(["ios", "android", "web"])("records %s at signup without changing the registration flow", async platform => {
    vi.stubGlobal("Capacitor", platform === "web" ? undefined : { getPlatform: () => platform, isNativePlatform: () => true });
    render(<SignUp />);
    fireEvent.change(screen.getByLabelText("E-post"), { target: { value: "tester@example.test" } });
    fireEvent.change(screen.getByLabelText("Lösenord"), { target: { value: "example-password" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Skapa konto" }));
    await waitFor(() => expect(mock.navigate).toHaveBeenCalled());
    expect(mock.signUp).toHaveBeenCalledExactlyOnceWith({
      email: "tester@example.test", password: "example-password",
      options: { emailRedirectTo: `${window.location.origin}/idag`, data: { registration_platform: platform } },
    });
  });
});
