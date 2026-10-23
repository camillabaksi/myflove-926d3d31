import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { INVISIBLE_WORK_EVENT, InvisibleWorkToday, type InvisibleWorkEntry } from "./invisible-work-today";

const state = vi.hoisted(() => ({
  userId: "owner-a",
  activeOwner: "owner-a",
  date: "2026-10-23",
  persisted: [] as InvisibleWorkEntry[],
  toast: vi.fn(),
}));
vi.mock("@clerk/react", () => ({
  useUser: () => ({ user: state.userId ? { id: state.userId } : null }),
}));
vi.mock("@/lib/account-scope", () => ({
  isActiveOwner: (id: string | null) => !!id && id === state.activeOwner,
}));
vi.mock("@/lib/day", () => ({ todayISO: () => state.date }));
vi.mock("sonner", () => ({ toast: state.toast }));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: <T,>(_key: string, _initial: T) => {
    const [value, setValue] = useState<T>(state.persisted as T);
    const setAndPersist = (next: T | ((previous: T) => T)) => setValue(previous => {
      const updated = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
      state.persisted = updated as InvisibleWorkEntry[];
      return updated;
    });
    return [value, setAndPersist] as const;
  },
}));

const row = (id: string, owner = "owner-a", date = "2026-10-23", source: InvisibleWorkEntry["source"] = "note"): InvisibleWorkEntry => ({
  id, owner, date, text: id === "first" ? "Ett långt osynligt arbete som tog mycket tid" : id === "second" ? "Planerade åt familjen" : "Privat anteckning", source,
  ...(source === "activity" ? { sourceId: "calendar-original" } : {}),
});

const openList = () => fireEvent.click(screen.getByRole("button", { name: /Det osynliga arbetet \(/ }));

beforeEach(() => {
  state.userId = "owner-a";
  state.activeOwner = "owner-a";
  state.date = "2026-10-23";
  state.persisted = [];
  vi.clearAllMocks();
});

describe("Det osynliga arbetet – remove one display entry", () => {
  it("shows a readable 44px delete action and removes only the selected owned entry", () => {
    state.persisted = [
      row("first"), row("second", "owner-a", "2026-10-23", "activity"),
      row("other-account", "owner-b"), row("older-day", "owner-a", "2026-10-22"),
    ];
    const view = render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    openList();
    const remove = screen.getByRole("button", { name: "Ta bort Ett långt osynligt arbete som tog mycket tid från Det osynliga arbetet" });
    expect(remove).toHaveClass("min-h-11", "min-w-11");
    fireEvent.click(remove);
    expect(state.persisted.map(entry => entry.id)).toEqual(["second", "other-account", "older-day"]);
    expect(screen.queryByText("Ett långt osynligt arbete som tog mycket tid")).not.toBeInTheDocument();
    expect(screen.getByText("Planerade åt familjen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Det osynliga arbetet (1)" })).toBeInTheDocument();
    expect(state.toast).toHaveBeenCalledWith("Borttaget från Det osynliga arbetet.", expect.objectContaining({
      action: expect.objectContaining({ label: "Ångra" }),
    }));
    view.unmount();
    render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Det osynliga arbetet (2)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Det osynliga arbetet (1)" })).toBeInTheDocument();
  });

  it("offers Undo exactly once, without affecting the original completed activity or note", () => {
    state.persisted = [row("first", "owner-a", "2026-10-23", "activity"), row("second")];
    render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    openList();
    fireEvent.click(screen.getByRole("button", { name: /Ta bort Ett långt osynligt arbete/ }));
    const call = state.toast.mock.calls[0] as [string, { action: { onClick: () => void } }];
    act(() => call[1].action.onClick());
    act(() => call[1].action.onClick());
    expect(state.persisted).toHaveLength(2);
    expect(state.persisted.find(entry => entry.id === "first"))
      .toMatchObject({ source: "activity", sourceId: "calendar-original" });
    expect(screen.getByText("Ett långt osynligt arbete som tog mycket tid")).toBeInTheDocument();
  });

  it("refuses deletion or undo if the account changes after the row was shown", () => {
    state.persisted = [row("first")];
    render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    openList();
    state.activeOwner = "owner-b";
    fireEvent.click(screen.getByRole("button", { name: /Ta bort Ett långt/ }));
    expect(state.persisted).toHaveLength(1);
    expect(state.toast).not.toHaveBeenCalled();
    state.activeOwner = "owner-a";
    fireEvent.click(screen.getByRole("button", { name: /Ta bort Ett långt/ }));
    expect(state.persisted).toHaveLength(0);
    state.activeOwner = "owner-b";
    const [, options] = state.toast.mock.calls[0] as [string, { action: { onClick: () => void } }];
    act(() => options.action.onClick());
    expect(state.persisted).toHaveLength(0);
  });

  it("refuses deleting yesterday's row from a stale mounted Today view", () => {
    state.persisted = [row("first")];
    render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    openList();
    state.date = "2026-10-24";
    fireEvent.click(screen.getByRole("button", { name: /Ta bort Ett långt/ }));
    expect(state.persisted).toHaveLength(1);
    expect(state.toast).not.toHaveBeenCalled();
  });

  it("allows a removed note to be explicitly included again and keeps the original note untouched", () => {
    state.persisted = [row("first")];
    render(<InvisibleWorkToday pending={null} onDismiss={vi.fn()} />);
    openList();
    fireEvent.click(screen.getByRole("button", { name: /Ta bort Ett långt/ }));
    expect(state.persisted).toHaveLength(0);
    act(() => window.dispatchEvent(new CustomEvent(INVISIBLE_WORK_EVENT, {
      detail: { owner: "owner-a", date: "2026-10-23", text: "Ett långt osynligt arbete som tog mycket tid" },
    })));
    expect(state.persisted).toHaveLength(1);
    expect(state.persisted[0]).toMatchObject({ owner: "owner-a", source: "note" });
  });

  it("keeps the existing opt-in of completed activities after introducing a delete action", () => {
    const dismiss = vi.fn();
    render(<InvisibleWorkToday pending={{ id: "activity-1", title: "Ringde vården" }} onDismiss={dismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "Räkna med det" }));
    expect(state.persisted).toHaveLength(1);
    expect(state.persisted[0]).toMatchObject({
      owner: "owner-a", date: "2026-10-23", source: "activity", sourceId: "activity-1",
      text: "Ringde vården",
    });
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
