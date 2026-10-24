import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EveningCheck, { formatEveningEnergy } from "./evening-check";

const state = vi.hoisted(() => ({
  owner: "user-a",
  ork10: 5,
  savedWrites: 0,
  entries: [] as { title: string; direction: string; occurredAt: string }[],
  addFactor: vi.fn(),
  logEvening: vi.fn(),
  setEvening: vi.fn(),
  track: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: <T,>(key: string, initial: T) => {
    const [value, setValue] = useState(initial);
    return [value, (next: T | ((previous: T) => T)) => {
      if (key === "paceable-evening-reflections-v1") state.savedWrites++;
      setValue(next);
    }] as const;
  },
}));
vi.mock("@/lib/account-scope", () => ({
  getDataOwner: () => state.owner,
  isActiveOwner: (id: string | null) => !!id && id === state.owner,
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => state.navigate }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (s: string) => s }) }));
vi.mock("@/hooks/use-evening-check", () => ({
  useEveningCheck: () => ({ evening: null, eveningHistory: [], logEvening: state.logEvening }),
}));
vi.mock("@/hooks/use-day-journey", () => ({
  useDayJourney: () => ({ input: { ork10: state.ork10, batteryNow: 45, done: 2, planned: 3, openThoughts: 1 } }),
}));
vi.mock("@/hooks/use-day-window", () => ({
  useDayWindow: () => ({ todayEdges: { morning: 5, evening: null }, setEvening: state.setEvening }),
}));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({ entries: state.entries, addFactor: state.addFactor, loading: false }),
}));
vi.mock("@/lib/analytics", () => ({ track: state.track }));
vi.mock("@/lib/collapse-store", () => ({
  useCollapsible: () => ({ collapsed: false, toggle: vi.fn() }),
}));

function startEvening() {
  fireEvent.click(screen.getByRole("button", { name: "Ja, börja kvällsstunden" }));
  fireEvent.click(screen.getByRole("button", { name: "Börja" }));
}
function next() {
  fireEvent.click(screen.getByRole("button", { name: "Nästa" }));
}
function goToSave() {
  startEvening();
  fireEvent.click(screen.getByRole("button", { name: /Blandat/ }));
  next(); // Step 2: evening energy
  next(); // Step 3: day summary
  next(); // Step 4: reflection
  next(); // Step 5: final confirmation
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 23, 20, 30));
  state.owner = "user-a";
  state.ork10 = 5;
  state.entries = [];
  state.savedWrites = 0;
  vi.clearAllMocks();
  state.addFactor.mockImplementation(async (input: { title: string; direction: string }) => {
    const result = { ...input, id: crypto.randomUUID(), occurredAt: new Date().toISOString() };
    state.entries = [...state.entries, result];
    return result;
  });
});
afterEach(() => vi.useRealTimers());

describe("Kvällsstunden – explicit save and optional tomorrow", () => {
  it("rounds the reported registered energy to one Swedish decimal without changing the value", () => {
    const registered = 6.3999999999999995;
    expect(formatEveningEnergy(registered)).toBe("6,4");
    expect(registered).toBe(6.3999999999999995);
    expect(formatEveningEnergy(6)).toBe("6");
    expect(formatEveningEnergy(0)).toBe("0");
    expect(formatEveningEnergy(9.96)).toBe("10");
    expect(formatEveningEnergy(Number.NaN)).toBe("—");
    state.ork10 = registered;
    render(<EveningCheck />);
    startEvening();
    next(); next();
    expect(screen.getByText("Registrerad ork: 6,4 av 10.")).toBeInTheDocument();
    expect(state.ork10).toBe(registered);
    expect(state.savedWrites).toBe(0);
  });

  it("does not write mood or energy just because the user presses Next, then closes early", () => {
    render(<EveningCheck />);
    startEvening();
    fireEvent.click(screen.getByRole("button", { name: /Blandat/ }));
    next();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
    next();
    expect(state.logEvening).not.toHaveBeenCalled();
    expect(state.setEvening).not.toHaveBeenCalled();
    expect(state.savedWrites).toBe(0);
    expect(state.addFactor).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Stäng kvällsstunden" }));
    expect(state.savedWrites).toBe(0);
    expect(state.logEvening).not.toHaveBeenCalled();
  });

  it("saves mood, evening energy and reflection together only after the final Save", async () => {
    render(<EveningCheck />);
    startEvening();
    fireEvent.click(screen.getByRole("button", { name: /Blandat/ }));
    next();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
    next();
    next();
    fireEvent.change(screen.getByLabelText("Frivillig reflektion"), { target: { value: "Jag behövde lugn." } });
    next();
    expect(state.logEvening).not.toHaveBeenCalled();
    expect(state.setEvening).not.toHaveBeenCalled();
    expect(state.savedWrites).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Spara min dag" }));
    });
    expect(state.logEvening).toHaveBeenCalledOnce();
    expect(state.logEvening).toHaveBeenCalledWith("som-vantat", expect.objectContaining({ planned: 3, done: 2 }));
    expect(state.setEvening).toHaveBeenCalledExactlyOnceWith(3);
    expect(state.savedWrites).toBe(1);
    expect(screen.getByRole("button", { name: /Planera morgondagen/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Planera morgondagen/ }));
    expect(state.navigate).toHaveBeenCalledWith({ to: "/planera", search: { audience: "me", period: "tomorrow" } });
  });

  it("reuses today's recorded energy sources; only genuinely new ones are written", async () => {
    state.entries = [{ title: "  NATUREN ", direction: "gives", occurredAt: new Date().toISOString() }];
    render(<EveningCheck />);
    startEvening();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Naturen" }));
    fireEvent.click(screen.getByRole("button", { name: "En paus" }));
    next(); next(); next();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Spara min dag" }));
    });
    expect(state.addFactor).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      title: "En paus", direction: "gives", category: "aterhamtning",
    }));
  });

  it("retains confirmed sources on a partial write failure and retries only the missing entry", async () => {
    let failSecond = true;
    state.addFactor.mockImplementation(async (input: { title: string; direction: string }) => {
      if (input.title === "Naturen" && failSecond) throw new Error("offline");
      const row = { ...input, id: crypto.randomUUID(), occurredAt: new Date().toISOString() };
      state.entries = [...state.entries, row];
      return row;
    });
    render(<EveningCheck />);
    startEvening();
    next();
    fireEvent.click(screen.getByRole("button", { name: "En paus" }));
    fireEvent.click(screen.getByRole("button", { name: "Naturen" }));
    next(); next(); next();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Spara min dag" }));
    });
    expect(state.addFactor).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("alert")).toHaveTextContent("offline");
    expect(state.savedWrites).toBe(0);
    failSecond = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Spara min dag" }));
    });
    expect(state.addFactor).toHaveBeenCalledTimes(3);
    expect(state.addFactor.mock.calls.map(call => call[0].title)).toEqual(["En paus", "Naturen", "Naturen"]);
    expect(state.savedWrites).toBe(1);
  });

  it("stops late save if the local day or account changed after the evening was opened", async () => {
    render(<EveningCheck />);
    goToSave();
    vi.setSystemTime(new Date(2026, 9, 24, 0, 2));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Spara min dag" }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/Dagen eller kontot har ändrats/);
    expect(state.savedWrites).toBe(0);
    expect(state.logEvening).not.toHaveBeenCalled();
    expect(state.setEvening).not.toHaveBeenCalled();
  });

  it("does not write an abandoned ritual when opening insights", () => {
    render(<EveningCheck />);
    goToSave();
    fireEvent.click(screen.getByRole("button", { name: "Till insikter" }));
    expect(state.navigate).toHaveBeenCalledWith({ to: "/insight", search: { demo: undefined } });
    expect(state.savedWrites).toBe(0);
    expect(state.logEvening).not.toHaveBeenCalled();
  });
});


describe("Kvällsstund – background assets on iPhone", () => {
  it("uses bundled responsive image elements on first and last step without saving", () => {
    render(<EveningCheck />);
    fireEvent.click(screen.getByRole("button", { name: "Ja, börja kvällsstunden" }));

    const intro = screen.getByTestId("evening-ritual-backdrop");
    expect(intro.tagName.toLowerCase()).toBe("picture");
    expect(intro.querySelector("source")).toHaveAttribute("media", "(min-width: 640px)");
    expect(intro.querySelector("source")?.getAttribute("srcset")).toContain("intro-desktop");
    expect(intro.querySelector("img")?.getAttribute("src")).toContain("intro-mobile");
    expect(intro.querySelector("img")).toHaveAttribute("loading", "eager");
    expect(intro.querySelector("img")).toHaveAttribute("alt", "");

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Nästa" }));
      if (index < 4) expect(screen.queryByTestId("evening-ritual-backdrop")).not.toBeInTheDocument();
    }

    const outro = screen.getByTestId("evening-ritual-backdrop");
    expect(outro.querySelector("source")?.getAttribute("srcset")).toContain("outro-desktop");
    expect(outro.querySelector("img")?.getAttribute("src")).toContain("outro-mobile");
    expect(state.savedWrites).toBe(0);
    expect(state.setEvening).not.toHaveBeenCalled();
    expect(state.logEvening).not.toHaveBeenCalled();
  });
});
