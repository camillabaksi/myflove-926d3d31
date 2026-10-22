import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VisualChildSchedule from "./visual-child-schedule";
import { addDaysISO, todayISO } from "@/lib/day";
import { encodeVisualNotes } from "@/lib/child-visual-schedule";
import type { Child, ChildItem } from "@/hooks/use-children";
import type { ChildScheduleInput } from "@/lib/add-child-schedule";

vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ openItems: [], absorb: vi.fn() }) }));
vi.mock("@/lib/account-scope", () => ({ isActiveOwner: () => true }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial), getSyncUser: async () => ({ id: "parent" }) }));
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
const child: Child = { id: "first", owner_id: "parent", name: "Barn", birthdate: null, color: "", note: null, helps: [], avatar: null };
const item: ChildItem = { id: "a", child_id: child.id, owner_id: "parent", kind: "activity", title: "Frukost", date: todayISO(), time: null, notes: encodeVisualNotes({ pictogram: "breakfast", category: "mat", tone: "sun" }), completed: true, remind: false, repeat: "none", file_path: null, created_at: "", updated_at: "", sharedWith: [], shareNotify: {} };
const callbacks = { onClose: vi.fn(), addItem: vi.fn(), updateItem: vi.fn(), toggleItem: vi.fn(), deleteItem: vi.fn(), uploadDoc: vi.fn(), copyDoc: vi.fn(), openDoc: vi.fn(async () => "https://example.test/own-photo.png") };

describe("Child schedule picture support", () => {
  it("can hide and restore pictures without changing text, times or activities", () => {
    const { container } = render(<VisualChildSchedule child={child} children={[child]} items={[item]} {...callbacks} readOnly />);
    expect(container.querySelector('[data-mulberry-symbol="breakfast"]')).toHaveClass("h-11", "w-11");
    fireEvent.click(screen.getByRole("switch", { name: "Visa bildstöd" }));
    expect(container.querySelector("[data-mulberry-symbol]")).toBeNull();
    expect(screen.getByText("Frukost")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Klarmarkera|Markera klar|Ändra|Flytta upp/ })).not.toBeInTheDocument();
    expect(callbacks.updateItem).not.toHaveBeenCalled();
    expect(callbacks.toggleItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("switch", { name: "Visa bildstöd" }));
    expect(container.querySelector('[data-mulberry-symbol="breakfast"]')).not.toBeNull();
  });
  it("keeps separate display choices when switching child profiles", () => {
    const other = { ...child, id: "second", name: "Andra barnet" };
    const { rerender } = render(<VisualChildSchedule child={child} children={[child, other]} items={[item]} {...callbacks} readOnly />);
    fireEvent.click(screen.getByRole("switch", { name: "Visa bildstöd" }));
    rerender(<VisualChildSchedule child={other} children={[child, other]} items={[]} {...callbacks} readOnly />);
    expect(screen.getByRole("switch", { name: "Visa bildstöd" })).toBeChecked();
    rerender(<VisualChildSchedule child={child} children={[child, other]} items={[item]} {...callbacks} readOnly />);
    expect(screen.getByRole("switch", { name: "Visa bildstöd" })).not.toBeChecked();
  });
  it("preserves own photos at a compact size in day and week views", async () => {
    render(<VisualChildSchedule child={child} children={[child]} items={[{ ...item, file_path: "private/photo.jpg" }]} {...callbacks} readOnly />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Frukost" })).toHaveAttribute("src", "https://example.test/own-photo.png"));
    expect(screen.getByRole("img", { name: "Frukost" })).toHaveClass("h-11", "w-11");
    fireEvent.click(screen.getByRole("tab", { name: "Vecka" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Frukost" })).toHaveClass("h-9", "w-9"));
  });
});


describe("Add from a child schedule", () => {
  it("does not copy a routine onto a day where its recurring occurrence already exists", async () => {
    const addItem = vi.fn(async () => "created");
    const routine = { ...item, date: addDaysISO(todayISO(), -7), time: "06:15", repeat: "daily" as const };
    render(<VisualChildSchedule child={child} children={[child]} items={[routine]} {...callbacks} addItem={addItem} />);
    fireEvent.click(screen.getByRole("button", { name: "Kopiera dagen" }));
    fireEvent.click(screen.getByRole("button", { name: "Kopiera" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(addItem).not.toHaveBeenCalled();
  });

  it("does not add a day template over an existing recurring occurrence", async () => {
    const addItem = vi.fn(async () => "created");
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("Min frukostmall");
    // Save an actual one-off as a template, then replace the fixture with its recurring form.
    const dated = { ...item, time: "06:15" };
    const view = render(<VisualChildSchedule child={child} children={[child]} items={[dated]} {...callbacks} addItem={addItem} />);
    fireEvent.click(screen.getByRole("tab", { name: "Vecka" }));
    fireEvent.click(screen.getByRole("button", { name: "Verktyg för schemat" }));
    fireEvent.click(screen.getByRole("button", { name: "Spara dagen som mall" }));
    prompt.mockRestore();
    view.rerender(<VisualChildSchedule child={child} children={[child]} items={[{ ...dated, date: addDaysISO(todayISO(), -7), repeat: "daily" }]} {...callbacks} addItem={addItem} />);
    fireEvent.click(screen.getByRole("button", { name: "Min frukostmall" }));
    expect(addItem).not.toHaveBeenCalled();
  });

  it("preselects the current child and can add the same visual activity to another owned child", async () => {
    const other = { ...child, id: "second", name: "Andra barnet" };
    const addItem = vi.fn(async () => "created");
    render(<VisualChildSchedule child={child} children={[child, other]} items={[]} {...callbacks} addItem={addItem} />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    expect(screen.getByRole("checkbox", { name: child.name })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: other.name }));
    fireEvent.change(screen.getByPlaceholderText("Aktivitetens namn"), { target: { value: "Lunch" } });
    fireEvent.click(screen.getByRole("button", { name: "Spara för 2 barn" }));
    fireEvent.click(screen.getByRole("button", { name: "Spara för 2 barn" }));
    await waitFor(() => expect(addItem).toHaveBeenCalledTimes(2));
  });
  it("stores a separate photo path for each selected child's activity", async () => {
    const other = { ...child, id: "second", name: "Andra barnet" };
    const addItem = vi.fn(async (_input: ChildScheduleInput) => "created");
    const uploadDoc = vi.fn(async () => "first/photo.png");
    const copyDoc = vi.fn(async () => "second/photo.png");
    render(<VisualChildSchedule child={child} children={[child, other]} items={[]} {...callbacks} addItem={addItem} uploadDoc={uploadDoc} copyDoc={copyDoc} />);
    fireEvent.click(screen.getByRole("button", { name: "Lägg till" }));
    fireEvent.click(screen.getByRole("checkbox", { name: other.name }));
    fireEvent.change(screen.getByPlaceholderText("Aktivitetens namn"), { target: { value: "Skola" } });
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Spara för 2 barn" }));
    await waitFor(() => expect(addItem).toHaveBeenCalledTimes(2));
    expect(uploadDoc).toHaveBeenCalledExactlyOnceWith("first", file);
    expect(copyDoc).toHaveBeenCalledExactlyOnceWith("first/photo.png", "second");
    expect(addItem.mock.calls.map(([value]) => [value.childId, value.filePath])).toEqual([["first", "first/photo.png"], ["second", "second/photo.png"]]);
  });
});
