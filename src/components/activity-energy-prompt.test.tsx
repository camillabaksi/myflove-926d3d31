import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FlowItem } from "@/lib/flow-items";
import type { InstanceRecord } from "@/lib/activity-history";
import type { NewEnergyFactor } from "@/hooks/use-energy-flow";
import type { EnergyFactorEntry } from "@/lib/energy-flow";

const savedEntry = (input: NewEnergyFactor): EnergyFactorEntry => ({
  id: input.id ?? "factor",
  title: input.title,
  direction: input.direction,
  strength: input.strength,
  category: input.category,
  kind: input.kind ?? "vardag",
  friction: input.friction ?? null,
  note: input.note ?? null,
  countsTowardScore: true,
  occurredAt: input.occurredAt ?? new Date().toISOString(),
});
const addFactor = vi.fn<(input: NewEnergyFactor) => Promise<EnergyFactorEntry | null>>();
const setTaskActualEnergy = vi.fn();
const setHistoryEnergy = vi.fn();
let records: InstanceRecord[] = [];
let entries: EnergyFactorEntry[] = [];
vi.mock("@/hooks/use-energy-flow", () => ({ useEnergyFlow: () => ({ addFactor, entries }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ setTaskActualEnergy }) }));
vi.mock("@/hooks/use-activity-history", () => ({
  useActivityHistory: () => ({ records, setEnergy: setHistoryEnergy }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import ActivityEnergyPrompt from "@/components/activity-energy-prompt";
import GlobalActivityEnergyPrompt from "@/components/global-activity-energy-prompt";
import { emitActivityDone } from "@/lib/activity-energy-event";
const item = (id = "task-one", dueDate = "2026-10-11") =>
  ({ id, title: "Promenad", dueDate }) as FlowItem;

beforeEach(() => {
  records = [];
  entries = [];
  addFactor.mockReset();
  addFactor.mockImplementation(async (input) => savedEntry(input));
  setTaskActualEnergy.mockReset();
  setHistoryEnergy.mockReset();
});

describe("aktivitetens faktiska energipåverkan", () => {
  it("sparar kalenderförekomsten under rätt källa och datum", async () => {
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item("rem-one", "2026-10-10")} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    const input = addFactor.mock.calls[0][0];
    expect(input.direction).toBe("drains");
    expect(input.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHistoryEnergy).toHaveBeenCalledWith("reminder-one", "2026-10-10", "drains_much", {
      id: input.id,
      occurredAt: input.occurredAt,
    });
    expect(setTaskActualEnergy).not.toHaveBeenCalled();
  });

  it("låter användaren försöka igen med samma energipost efter ett fel", async () => {
    addFactor.mockRejectedValueOnce(new Error("Offline"));
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("aktiviteten är fortfarande klar");
    expect(onClose).not.toHaveBeenCalled();
    expect(setHistoryEnergy).not.toHaveBeenCalled();
    expect(setTaskActualEnergy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(addFactor.mock.calls[1][0].id).toBe(addFactor.mock.calls[0][0].id);
    expect(addFactor.mock.calls[1][0].occurredAt).toBe(addFactor.mock.calls[0][0].occurredAt);
    expect(setTaskActualEnergy).toHaveBeenCalledWith("one", "drains");
  });

  it("behandlar inte en utebliven energipost som ett lyckat sparande", async () => {
    addFactor.mockResolvedValue(null);
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    await screen.findByRole("alert");
    expect(setHistoryEnergy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uppdaterar en befintlig förekomst i samma energipost", async () => {
    records = [
      {
        key: "task-one|2026-10-11",
        sourceId: "task-one",
        date: "2026-10-11",
        energyImpact: "drains_much",
        energyFactorId: "old-factor",
        energyFactorOccurredAt: "2026-10-11T09:00:00.000Z",
      },
    ];
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Gav energi/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(addFactor).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "old-factor",
        occurredAt: "2026-10-11T09:00:00.000Z",
        direction: "gives",
      }),
    );
    expect(setHistoryEnergy).toHaveBeenCalledWith(
      "task-one",
      "2026-10-11",
      "gives",
      expect.objectContaining({ id: "old-factor" }),
    );
  });

  it("återanvänder en entydig äldre energipost som saknar journalkoppling", async () => {
    const at = Date.parse("2026-10-11T09:00:00Z");
    records = [
      {
        key: "task-one|2026-10-11",
        sourceId: "task-one",
        date: "2026-10-11",
        energyImpact: "drains_much",
        energyImpactRecordedAt: at,
      },
    ];
    entries = [
      savedEntry({
        id: "legacy",
        title: "Promenad",
        direction: "drains",
        strength: 4,
        category: "annat",
        kind: "planerat",
        occurredAt: new Date(at).toISOString(),
      }),
    ];
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(addFactor).toHaveBeenCalledWith(expect.objectContaining({ id: "legacy" }));
  });

  it("loggar inget när användaren väljer Vet inte", () => {
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Vet inte/ }));
    expect(addFactor).not.toHaveBeenCalled();
    expect(setHistoryEnergy).not.toHaveBeenCalled();
    expect(setTaskActualEnergy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("väntar på bekräftelse och stoppar dubbeltryck", async () => {
    let finish!: (entry: EnergyFactorEntry) => void;
    addFactor.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const onClose = vi.fn();
    render(<ActivityEnergyPrompt item={item()} onClose={onClose} />);
    const pick = screen.getByRole("button", { name: /Tog energi/ });
    fireEvent.click(pick);
    fireEvent.click(pick);
    expect(pick).toBeDisabled();
    expect(addFactor).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(setHistoryEnergy).not.toHaveBeenCalled();
    await act(async () => finish(savedEntry(addFactor.mock.calls[0][0])));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("behåller nästa aktivitet i kön medan den första besvaras", async () => {
    render(<GlobalActivityEnergyPrompt />);
    act(() => {
      emitActivityDone({ id: "task-one", title: "Promenad", dueDate: "2026-10-11" });
      emitActivityDone({ id: "task-two", title: "Diska", dueDate: "2026-10-11" });
    });
    expect(screen.getByText("Promenad")).toBeVisible();
    expect(screen.queryByText("Diska")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Tog energi/ }));
    expect(await screen.findByText("Diska")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Gav energi/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(setTaskActualEnergy.mock.calls).toEqual([
      ["one", "drains"],
      ["two", "gives"],
    ]);
  });
});
