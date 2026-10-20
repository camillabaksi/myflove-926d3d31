import { beforeEach, expect, it, vi } from "vitest";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  auth: null as null | ((event: AuthChangeEvent, session: Session | null) => void),
  getSession: vi.fn(), bindAccount: vi.fn(), parkActiveData: vi.fn(), lockSecureLocal: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: mocks.getSession,
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => { mocks.auth = callback; },
} } }));
vi.mock("@/lib/account-scope", () => ({ bindAccount: mocks.bindAccount, parkActiveData: mocks.parkActiveData }));
vi.mock("@/lib/secure-local", () => ({ lockSecureLocal: mocks.lockSecureLocal }));
vi.mock("@/lib/cloud-storage", () => ({ ACCOUNT_BOUND_EVENT: "test-account-bound" }));
vi.mock("@/lib/local-data", () => ({ clearLocalUserData: vi.fn() }));
vi.mock("@/lib/demo-account", () => ({ setDemoSession: vi.fn() }));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); mocks.bindAccount.mockReturnValue("same"); });

it("parks data and locks plaintext on unexpected sign-out; a late initial session cannot rebind it", async () => {
  let resolve: ((value: { data: { session: Session | null } }) => void) | undefined;
  mocks.getSession.mockReturnValue(new Promise((done) => { resolve = done; }));
  await import("./clerk");
  mocks.auth?.("SIGNED_OUT", null);
  expect(mocks.parkActiveData).toHaveBeenCalledOnce();
  expect(mocks.lockSecureLocal).toHaveBeenCalledWith({ keepKey: true });
  resolve?.({ data: { session: { user: { id: "synthetic-a" } } as Session } });
  await new Promise((done) => setTimeout(done, 0));
  expect(mocks.bindAccount).not.toHaveBeenCalled();
});

it("token refresh does not park or clear the active account", async () => {
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  await import("./clerk");
  mocks.auth?.("TOKEN_REFRESHED", { user: { id: "synthetic-a" } } as Session);
  expect(mocks.bindAccount).toHaveBeenCalledWith("synthetic-a", { adoptUnowned: false });
  expect(mocks.parkActiveData).not.toHaveBeenCalled();
  expect(mocks.lockSecureLocal).not.toHaveBeenCalled();
});