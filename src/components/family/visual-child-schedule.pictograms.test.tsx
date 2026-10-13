import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VisualChildSchedule from "./visual-child-schedule";
import { todayISO } from "@/lib/day";
import { encodeVisualNotes } from "@/lib/child-visual-schedule";
import type { Child, ChildItem } from "@/hooks/use-children";

vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text, locale: "sv-SE" }) }));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ openItems: [], absorb: vi.fn() }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => useState(initial) }));
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
    await waitFor(() => expect(screen.getByRole("img", { name: "Frukost" })).toHaveClass("h-8", "w-8"));
  });
});
