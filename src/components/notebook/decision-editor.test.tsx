import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { BookEntity, NotebookContent } from "@/lib/notebook";
import type { NotebookStore } from "@/hooks/use-notebook";

const calls = vi.hoisted(() => ({ update: vi.fn(), flush: vi.fn() }));
vi.mock("@/hooks/use-notebook", () => ({
  useBookDraft: (entity: BookEntity) => {
    const [draft, setDraft] = useState(entity.content);
    return {
      draft,
      update: (patch: Partial<NotebookContent>) => {
        calls.update(patch);
        setDraft((current) => ({ ...current, ...patch }));
      },
      flush: calls.flush,
      reset: vi.fn(),
    };
  },
}));
vi.mock("./book-editor", () => ({ BookHistory: () => null, SourceLink: () => null }));
import { DecisionEditor } from "./decision-editor";

const content: NotebookContent = { title: "Ska jag byta jobb?", text: "", date: "2026-10-15" };
const decision: BookEntity = { id: "decision", kind: "decision", content, heads: [], revisions: [] };
function setup() {
  const points: BookEntity[] = [0, 1].map((i) => ({
    id: `point-${i}`, kind: "point", heads: [], revisions: [],
    content: { ...content, title: "", text: `Min tanke ${i}`, bookId: decision.id, column: "pros", order: i },
  }));
  const store: NotebookStore = { entities: [decision, ...points], create: vi.fn(), save: vi.fn(), status: "Teststatus", retry: vi.fn() };
  render(<DecisionEditor entity={decision} store={store} />);
  return store;
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
async function openMenu() {
  await userEvent.click(screen.getAllByRole("button", { name: "Fler alternativ" })[0]);
}
describe("Beslut – papperspresentation", () => {
  it("has a labelled handwritten topic and inline writing without old toolbars", () => {
    setup();
    expect(screen.getByLabelText("Vad funderar du på?").className).toBe("book-decision-title");
    expect(screen.getAllByRole("button", { name: "Fler alternativ" })).toHaveLength(2);
    expect(screen.queryByLabelText("Flytta till")).toBeNull();
    fireEvent.change(screen.getByLabelText("Punkt 1"), { target: { value: "Egen text" } });
    expect(calls.update).toHaveBeenCalledWith({ text: "Egen text" });
  });
  it.each([ ["Markera som viktig", "important"], ["Stjärnmarkera", "starred"], ["Stryk över", "crossed"] ])("preserves %s", async (label, key) => {
    setup(); await openMenu();
    await userEvent.click(screen.getByRole("menuitemcheckbox", { name: label }));
    expect(calls.update).toHaveBeenCalledWith({ [key]: true });
    if (key === "starred") expect(screen.getByRole("img", { name: "Stjärnmarkerad" })).toBeTruthy();
  });
  it("preserves explicit column moves and deletion", async () => {
    setup(); await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /^Flytta till Nackdelar$/ }));
    expect(calls.update).toHaveBeenCalledWith({ column: "cons", order: expect.any(Number) });
    expect(calls.flush).toHaveBeenCalled();
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Ta bort punkt" }));
    expect(calls.update).toHaveBeenCalledWith({ deleted: true });
  });
  it("keeps order actions and their boundary guards", async () => {
    const store = setup(); await openMenu();
    expect(screen.getByRole("menuitem", { name: "Flytta upp" }).getAttribute("data-disabled")).not.toBeNull();
    await userEvent.click(screen.getByRole("menuitem", { name: "Flytta ner" }));
    expect(calls.update).toHaveBeenCalledWith({ order: 1 });
    expect(store.save).toHaveBeenCalledWith("point-1", "point", expect.objectContaining({ order: 0 }), []);
  });
  it("preserves focus mode, optional uncertain column, and help after the paper", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Visa spalter"), { target: { value: "cons" } });
    expect(screen.queryByRole("region", { name: "Fördelar" })).toBeNull();
    expect(within(screen.getByRole("region", { name: "Nackdelar" })).getByRole("button", { name: "Lägg till…" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Osäkert än" }));
    expect(calls.update).toHaveBeenCalledWith({ uncertain: true });
    await userEvent.click(screen.getByRole("button", { name: "Hjälp mig sortera tankarna" }));
    expect(screen.getByText("Vad känns viktigt för dig just nu?")).toBeTruthy();
  });
  it("keeps responsive paper and 44px menu rules scoped locally", () => {
    const css = readFileSync("src/components/notebook/notebook.css", "utf8");
    expect(css).toContain('@container (max-width: 30rem)');
    expect(css).toContain('.notebook:has(.book-decision) .book-workspace');
    expect(css).toMatch(/\.book-decision-menu \[role\^="menuitem"\]\s*\{\s*min-height: 44px/);
    expect(css).toContain('font-family: "Caveat", "Segoe Print", cursive !important');
  });
});