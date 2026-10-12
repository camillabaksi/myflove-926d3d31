import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewEnergyFactor } from "@/hooks/use-energy-flow";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

const mocks = vi.hoisted(() => ({ addFactor: vi.fn(), announce: vi.fn(), toast: vi.fn() }));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({
    presets: [],
    signedIn: true,
    addFactor: mocks.addFactor,
    updateFactor: vi.fn(),
    removeFactor: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-voice-input", () => ({ useVoiceInput: () => ({ isSupported: false }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/lib/energy-save-feedback", () => ({
  announceSavedEnergy: mocks.announce,
  ENERGY_FEEDBACK_CLEAR_EVENT: "myflove:energy-feedback-clear",
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
import DidThisQuickAdd from "./did-this-quick-add";
import EnergyAfterCheck from "./recovery/energy-after-check";
const savedEntry = (input: NewEnergyFactor): EnergyFactorEntry => ({
  ...input,
  id: "factor-one",
  occurredAt: input.occurredAt ?? new Date().toISOString(),
  kind: input.kind ?? "vardag",
  note: null,
  friction: input.friction ?? null,
  countsTowardScore: true,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.addFactor.mockReset();
  mocks.addFactor.mockImplementation(async (input) => savedEntry(input));
});

it("waits for a confirmed observation before offering a battery update", async () => {
  let finish!: (entry: EnergyFactorEntry) => void;
  mocks.addFactor.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<DidThisQuickAdd />);
  expect(mocks.announce).not.toHaveBeenCalled();
  fireEvent.change(screen.getByPlaceholderText("Något annat du gjorde…"), {
    target: { value: "Diska" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
  fireEvent.click(screen.getByRole("button", { name: "Tog energi" }));
  expect(mocks.announce).not.toHaveBeenCalled();
  expect(screen.getByText(/Diska · Hur kändes det/)).toBeVisible();
  finish(savedEntry(mocks.addFactor.mock.calls[0][0]));
  await waitFor(() => expect(mocks.announce).toHaveBeenCalledOnce());
  expect(mocks.announce).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Diska", direction: "drains" }),
  );
  expect(screen.getByPlaceholderText("Något annat du gjorde…")).toHaveValue("");
  expect(mocks.toast).not.toHaveBeenCalledWith(
    expect.objectContaining({ description: expect.stringContaining("Det påverkar ditt batteri") }),
  );
});

it.each([null, new Error("Offline")])(
  "retains an unsaved quick-add draft without a success invitation (%s)",
  async (result) => {
    if (result instanceof Error) mocks.addFactor.mockRejectedValue(result);
    else mocks.addFactor.mockResolvedValue(result);
    render(<DidThisQuickAdd />);
    fireEvent.change(screen.getByPlaceholderText("Något annat du gjorde…"), {
      target: { value: "Mitt utkast" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    fireEvent.click(screen.getByRole("button", { name: "Tog energi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ditt val finns kvar");
    expect(screen.getByText(/Mitt utkast · Hur kändes det/)).toBeVisible();
    expect(mocks.announce).not.toHaveBeenCalled();
  },
);

it("passes the actual historical date rather than claiming yesterday changed today's battery", async () => {
  render(<DidThisQuickAdd />);
  fireEvent.click(screen.getByRole("button", { name: "Annan tid" }));
  fireEvent.click(screen.getByRole("button", { name: "Igår" }));
  fireEvent.change(screen.getByPlaceholderText("Något annat du gjorde…"), {
    target: { value: "Promenad" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
  fireEvent.click(screen.getByRole("button", { name: "Tog energi" }));
  await waitFor(() => expect(mocks.announce).toHaveBeenCalledOnce());
  const at = new Date(mocks.announce.mock.calls[0][0].occurredAt);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expect(at.toDateString()).toBe(yesterday.toDateString());
});

describe("recovery feedback", () => {
  it("only closes and offers a battery update after confirmed saving", async () => {
    const onDone = vi.fn();
    render(<EnergyAfterCheck title="Paus" source="paus" onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Mindre/ }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(mocks.announce).toHaveBeenCalledWith(expect.objectContaining({ direction: "drains" }));
  });
  it("keeps failed recovery answers open for retry", async () => {
    mocks.addFactor.mockResolvedValueOnce(null);
    const onDone = vi.fn();
    render(<EnergyAfterCheck title="Paus" source="paus" onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Mindre/ }));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
    expect(mocks.announce).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Mindre/ }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(mocks.announce).toHaveBeenCalledOnce();
    expect(mocks.addFactor.mock.calls[1][0].id).toBe(mocks.addFactor.mock.calls[0][0].id);
    expect(mocks.addFactor.mock.calls[1][0].occurredAt).toBe(
      mocks.addFactor.mock.calls[0][0].occurredAt,
    );
  });
});

it("låter användaren avgöra promenadens påverkan i två tryck", async () => {
  render(<DidThisQuickAdd />);
  fireEvent.click(screen.getByRole("button", { name: /Promenad/ }));
  expect(mocks.addFactor).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Tog energi" }));
  await waitFor(() => expect(mocks.announce).toHaveBeenCalled());
  expect(mocks.addFactor).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Promenad", direction: "drains", friction: null }),
  );
});

it.each([
  ["Tog lite energi", "drains"],
  ["Gav lite energi", "gives"],
] as const)("registrerar %s utan en ny uppgift", async (label, direction) => {
  render(<DidThisQuickAdd />);
  fireEvent.click(screen.getByRole("button", { name: /Promenad/ }));
  fireEvent.click(screen.getByRole("button", { name: label }));
  await waitFor(() => expect(mocks.announce).toHaveBeenCalledOnce());
  expect(mocks.addFactor).toHaveBeenCalledWith(expect.objectContaining({ direction, strength: 1 }));
});
