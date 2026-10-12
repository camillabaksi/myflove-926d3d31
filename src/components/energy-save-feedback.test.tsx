import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EnergyFactorEntry } from "@/lib/energy-flow";
import { DATA_OWNER_KEY } from "@/lib/account-scope";
import { dayOf } from "@/lib/day";
import { announceSavedEnergy, ENERGY_SAVED_EVENT } from "@/lib/energy-save-feedback";
import EnergyBatteryOffer from "./energy-battery-offer";
import EnergySaveFeedback from "./energy-save-feedback";
import { Toaster } from "@/components/ui/toaster";
const mocks = vi.hoisted(() => ({
  percent: 52 as number | null,
  logEnergyPercent: vi.fn(),
  logEnergy: vi.fn(),
  logMood: vi.fn(),
  addFactor: vi.fn(),
  authCallback: null as null | ((event: string) => void),
  t: (text: string) => text,
}));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: mocks.t, lang: "sv" }) }));
vi.mock("@/hooks/use-day-capacity", () => ({
  useDayCapacity: () => () => ({ percent: mocks.percent }),
}));
vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => ({
    energyValue: 6,
    moodValue: null,
    logEnergy: mocks.logEnergy,
    logEnergyPercent: mocks.logEnergyPercent,
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
  direction: "gives",
  strength: 3,
  category: "annat",
  kind: "planerat",
  friction: null,
  note: null,
  countsTowardScore: true,
  occurredAt: new Date().toISOString(),
  ...patch,
});
const Host = () => (
  <>
    <EnergySaveFeedback />
    <Toaster />
  </>
);
const announce = (factor = entry(), date?: string) => act(() => announceSavedEnergy(factor, date));
beforeEach(() => {
  window.localStorage.setItem(DATA_OWNER_KEY, "owner-a");
  mocks.percent = 52;
  mocks.logEnergyPercent.mockReset();
  mocks.logEnergyPercent.mockResolvedValue({ synced: true });
  mocks.logEnergy.mockReset();
  mocks.logEnergy.mockResolvedValue({ synced: true });
  mocks.logMood.mockClear();
  mocks.addFactor.mockClear();
});
describe("optional small battery update", () => {
  it("records no capacity until the explicit second tap, with no mood or duplicate factor", async () => {
    render(<Host />);
    announce();
    expect(mocks.logEnergyPercent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Uppdatera till 57 %" }));
    await screen.findByText("Batteriet är uppdaterat.");
    expect(mocks.logEnergyPercent).toHaveBeenCalledExactlyOnceWith(57);
    expect(mocks.addFactor).not.toHaveBeenCalled();
    expect(mocks.logMood).not.toHaveBeenCalled();
  });
  it("retains an adjusted draft after a failed save and saves on retry", async () => {
    mocks.logEnergyPercent.mockRejectedValueOnce(new Error("Offline"));
    render(<Host />);
    announce(entry({ direction: "drains" }));
    fireEvent.click(screen.getByRole("button", { name: "Justera" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "49" } });
    fireEvent.click(screen.getByRole("button", { name: "Uppdatera till 49 %" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ditt val finns kvar");
    expect(screen.getByRole("slider")).toHaveValue("49");
    fireEvent.click(screen.getByRole("button", { name: "Uppdatera till 49 %" }));
    await screen.findByText("Batteriet är uppdaterat.");
    expect(mocks.logEnergyPercent).toHaveBeenLastCalledWith(49);
  });
  it("guards a draft against a newer capacity registration", async () => {
    const props = {
      detail: { owner: "owner-a", direction: "gives" as const, date: dayOf(new Date()) },
      onSaved: vi.fn(),
      onCheckin: vi.fn(),
    };
    const view = render(<EnergyBatteryOffer {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Justera" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "57" } });
    mocks.percent = 70;
    view.rerender(<EnergyBatteryOffer {...props} />);
    expect(screen.getByRole("button", { name: "Uppdatera till 57 %" })).toBeDisabled();
    expect(mocks.logEnergyPercent).not.toHaveBeenCalled();
  });
  it("does not dismiss while saving or accept duplicate taps", async () => {
    let finish!: (result: { synced: boolean }) => void;
    mocks.logEnergyPercent.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<Host />);
    announce();
    const save = screen.getByRole("button", { name: "Uppdatera till 57 %" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(mocks.logEnergyPercent).toHaveBeenCalledOnce();
    expect(save).toBeDisabled();
    await act(async () => finish({ synced: false }));
    expect(screen.getByText(/väntar på synkning/)).toBeVisible();
  });
  it.each(["neutral", "both"] as const)("does not offer a battery change for %s", (direction) => {
    render(<Host />);
    announce(entry({ direction }));
    expect(screen.getByText("Sparat i din energihistorik.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Uppdatera/ })).not.toBeInTheDocument();
  });
  it("does not change today's battery for a historical observation", () => {
    render(<Host />);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    announce(entry(), dayOf(yesterday)!);
    expect(screen.queryByRole("button", { name: /Uppdatera/ })).not.toBeInTheDocument();
  });
  it("opens the existing check-in when there is no baseline, without inventing a starting percentage", async () => {
    mocks.percent = null;
    render(<Host />);
    announce();
    fireEvent.click(screen.getByRole("button", { name: "Uppdatera mitt batteri" }));
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(mocks.logEnergyPercent).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "37" } });
    fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
    await screen.findByText("Batteriet är uppdaterat.");
    expect(mocks.logEnergyPercent).toHaveBeenCalledWith(37);
  });
  it("clears transient feedback on account change and ignores another owner's event", () => {
    render(<Host />);
    announce();
    act(() => {
      window.localStorage.setItem(DATA_OWNER_KEY, "owner-b");
      window.dispatchEvent(new Event("myflove-account-bound"));
    });
    expect(screen.queryByRole("button", { name: /Uppdatera/ })).not.toBeInTheDocument();
    act(() =>
      window.dispatchEvent(
        new CustomEvent(ENERGY_SAVED_EVENT, {
          detail: { owner: "owner-a", direction: "gives", date: dayOf(new Date()) },
        }),
      ),
    );
    expect(screen.queryByRole("button", { name: /Uppdatera/ })).not.toBeInTheDocument();
    expect(mocks.logEnergyPercent).not.toHaveBeenCalled();
  });
  it("dismisses feedback on sign-out", () => {
    render(<Host />);
    announce();
    act(() => mocks.authCallback?.("SIGNED_OUT"));
    expect(screen.queryByRole("button", { name: /Uppdatera/ })).not.toBeInTheDocument();
  });
});
