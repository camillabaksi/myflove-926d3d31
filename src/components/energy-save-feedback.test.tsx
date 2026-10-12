import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EnergyFactorEntry } from "@/lib/energy-flow";
import { DATA_OWNER_KEY } from "@/lib/account-scope";
import { dayOf } from "@/lib/day";
import { announceSavedEnergy, ENERGY_SAVED_EVENT } from "@/lib/energy-save-feedback";
import EnergySaveFeedback from "./energy-save-feedback";
import { Toaster } from "@/components/ui/toaster";

const mocks = vi.hoisted(() => ({
  logEnergy: vi.fn(),
  logMood: vi.fn(),
  addFactor: vi.fn(),
  authCallback: null as null | ((event: string) => void),
  t: (text: string) => text,
}));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: mocks.t, lang: "sv" }) }));
vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => ({
    energyValue: 6,
    moodValue: null,
    logEnergy: mocks.logEnergy,
    logMood: mocks.logMood,
  }),
}));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({ addFactor: mocks.addFactor }),
}));
vi.mock("@/hooks/use-flow-explainer", () => ({
  useFlowExplainer: () => ({ explain: () => null }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/cloud-storage", () => ({
  ACCOUNT_BOUND_EVENT: "myflove-account-bound",
  useCloudSyncedStorage: (_key: string, fallback: unknown) => [fallback, vi.fn()],
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: (event: string) => void) => {
        mocks.authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
}));

const entry = (patch: Partial<EnergyFactorEntry> = {}): EnergyFactorEntry => ({
  id: "factor-one",
  title: "Promenad",
  direction: "drains",
  strength: 4,
  category: "annat",
  kind: "planerat",
  friction: 2,
  note: null,
  countsTowardScore: true,
  occurredAt: new Date().toISOString(),
  ...patch,
});
const Host = ({ page = "Idag" }: { page?: string }) => (
  <>
    <p>{page}</p>
    <EnergySaveFeedback />
    <Toaster />
  </>
);
const announce = (factor = entry(), date?: string) => act(() => announceSavedEnergy(factor, date));
const openCheckin = () =>
  fireEvent.click(screen.getByRole("button", { name: "Uppdatera mitt batteri" }));

beforeEach(() => {
  window.localStorage.setItem(DATA_OWNER_KEY, "owner-a");
  mocks.logEnergy.mockReset();
  mocks.logEnergy.mockResolvedValue({ synced: true });
  mocks.logMood.mockClear();
  mocks.addFactor.mockClear();
});

describe("confirmed energy to battery check-in", () => {
  it("offers the existing check-in and only logs the user's chosen value after Save", async () => {
    render(<Host />);
    announce();
    expect(screen.getByText("Energipåverkan sparad")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.logEnergy).not.toHaveBeenCalled();
    openCheckin();
    const dialog = screen.getByRole("dialog", { name: "Uppdatera mitt batteri" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lågt" }));
    expect(mocks.logEnergy).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Logga energi & mående" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.logEnergy).toHaveBeenCalledOnce();
    expect(mocks.logEnergy).toHaveBeenCalledWith(3);
    expect(mocks.addFactor).not.toHaveBeenCalled();
    expect(screen.getByText("Batteriet är uppdaterat.")).toBeVisible();
  });
  it("retains the draft after a failed save and across an authenticated page change", async () => {
    mocks.logEnergy.mockRejectedValueOnce(new Error("Offline"));
    const view = render(<Host />);
    announce();
    openCheckin();
    fireEvent.click(screen.getByRole("button", { name: "Lågt" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mitt utkast" } });
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Dina val finns kvar");
    view.rerender(<Host page="Kalender" />);
    act(() => window.dispatchEvent(new Event("myflove-account-bound")));
    expect(screen.getByRole("textbox")).toHaveValue("Mitt utkast");
    expect(screen.getByRole("button", { name: "Lågt" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Batteriet är uppdaterat.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("offers the same update for gained energy without selecting a battery value", () => {
    render(<Host />);
    announce(entry({ direction: "gives" }));
    expect(screen.getByText(/loggat något som gav energi/)).toBeVisible();
    openCheckin();
    expect(mocks.logEnergy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Avbryt" }));
    expect(mocks.logEnergy).not.toHaveBeenCalled();
    expect(mocks.addFactor).not.toHaveBeenCalled();
  });
  it("confirms historical or neutral entries without inviting an update of today's battery", () => {
    render(<Host />);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    announce(entry(), dayOf(yesterday)!);
    expect(screen.getByText("Sparat i din energihistorik.")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Uppdatera mitt batteri" }),
    ).not.toBeInTheDocument();
    announce(entry({ direction: "neutral" }));
    expect(
      screen.queryByRole("button", { name: "Uppdatera mitt batteri" }),
    ).not.toBeInTheDocument();
    expect(mocks.logEnergy).not.toHaveBeenCalled();
  });
  it("clears the check-in on account changes and ignores feedback belonging to another owner", () => {
    render(<Host />);
    announce();
    openCheckin();
    act(() => {
      window.localStorage.setItem(DATA_OWNER_KEY, "owner-b");
      window.dispatchEvent(new Event("myflove-account-bound"));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() =>
      window.dispatchEvent(
        new CustomEvent(ENERGY_SAVED_EVENT, {
          detail: { owner: "owner-a", direction: "drains", date: dayOf(new Date()) },
        }),
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Uppdatera mitt batteri" }),
    ).not.toBeInTheDocument();
    expect(mocks.logEnergy).not.toHaveBeenCalled();
  });
  it("dismisses the check-in on sign-out and does not emit an ownerless confirmation", () => {
    const listener = vi.fn();
    window.addEventListener(ENERGY_SAVED_EVENT, listener);
    render(<Host />);
    announce();
    openCheckin();
    act(() => mocks.authCallback?.("SIGNED_OUT"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    listener.mockClear();
    window.localStorage.removeItem(DATA_OWNER_KEY);
    announce();
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(ENERGY_SAVED_EVENT, listener);
  });
});
