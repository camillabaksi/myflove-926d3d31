import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendRevision,
  makeRevision,
  projectNotebook,
  type BookKind,
  type BookRevision,
  type NotebookContent,
} from "@/lib/notebook";
import type { NotebookStore } from "@/hooks/use-notebook";

vi.mock("@/lib/account-scope", () => ({
  getDataOwner: () => "owner",
  isActiveOwner: (id: string) => id === "owner",
}));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: () => [[], vi.fn()],
  useCloudSyncStatus: () => "saved",
  hasUnsyncedCloudData: () => false,
  syncKeyNow: vi.fn(),
}));
vi.mock("@/lib/secure-local", () => ({
  getSecureStatus: () => "ready",
  hasUnpersistedSecureWrites: () => false,
  SECURE_STATUS_EVENT: "secure",
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
import { MapEditor } from "./map-editor";
import { BookTextEditor } from "./book-editor";

const content: NotebookContent = {
  title: "En lugn helg",
  text: "Tid för en promenad",
  date: "2026-10-16",
};
function setup(kind: "map" | "diary") {
  let rows = [makeRevision("page", kind, { ...content, text: kind === "map" ? "" : content.text })];
  function Harness() {
    const [revisions, setRevisions] = useState(rows);
    rows = revisions;
    const store: NotebookStore = {
      entities: projectNotebook(revisions),
      status: "Teststatus",
      retry: vi.fn(),
      save: (id: string, type: BookKind, next: NotebookContent, parents: string[]) => {
        const revision = makeRevision(id, type, next, parents);
        setRevisions((previous: BookRevision[]) => appendRevision(previous, revision));
        return revision;
      },
      create: (type, next) => {
        const id = crypto.randomUUID();
        const revision = makeRevision(id, type, next);
        setRevisions((previous) => appendRevision(previous, revision));
        return id;
      },
    };
    const entity = store.entities.find((entry) => entry.id === "page")!;
    return kind === "map" ? (
      <MapEditor entity={entity} store={store} />
    ) : (
      <BookTextEditor diary entity={entity} store={store} />
    );
  }
  render(<Harness />);
  return { entities: () => projectNotebook(rows) };
}
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});
afterEach(() => vi.unstubAllGlobals());

describe("Tankekarta med riktiga bokutkast", () => {
  it("adds a starter only after a choice and preserves writing when switching views", async () => {
    const saved = setup("map");
    expect(saved.entities().filter((entry) => entry.kind === "node")).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Använd startmallen" }));
    expect(saved.entities().filter((entry) => entry.kind === "node")).toHaveLength(4);
    expect(saved.entities().filter((entry) => entry.kind === "edge")).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Börja här"), { target: { value: "Min lediga dag" } });
    fireEvent.blur(screen.getByLabelText("Börja här"));
    await userEvent.click(screen.getByRole("button", { name: "Listvy" }));
    expect(screen.getByLabelText("Börja här")).toHaveValue("Min lediga dag");
    await userEvent.click(screen.getByRole("button", { name: "Kartvy" }));
    expect(screen.getByLabelText("Börja här")).toHaveValue("Min lediga dag");
    expect(saved.entities().filter((entry) => entry.kind === "node")).toHaveLength(4);
    expect(
      saved.entities().find((entry) => entry.content.title === "Börja här")?.heads,
    ).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Använd startmallen" })).toBeNull();
  });
  it("places new thoughts in free spaces after deletion and beyond the first nine", async () => {
    const saved = setup("map");
    for (let i = 0; i < 10; i++)
      await userEvent.click(screen.getByRole("button", { name: "Ny tanke" }));
    await userEvent.click(screen.getByRole("button", { name: "Alternativ för tanke 1" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Ta bort tanke" }));
    await userEvent.click(screen.getByRole("button", { name: "Ny tanke" }));
    const active = saved
      .entities()
      .filter((entry) => entry.kind === "node" && !entry.content.deleted);
    expect(active).toHaveLength(10);
    expect(new Set(active.map((entry) => `${entry.content.x},${entry.content.y}`)).size).toBe(10);
    expect(Math.max(...active.map((entry) => entry.content.y ?? 0))).toBeGreaterThan(600);
  });
  it("focuses newly created thoughts and retains text and coordinates across views", async () => {
    const saved = setup("map");
    await userEvent.click(screen.getByRole("button", { name: "Ny tanke" }));
    const first = screen.getByLabelText("Tanke 1");
    expect(first).toHaveFocus();
    fireEvent.change(first, { target: { value: "Ta en promenad" } });
    fireEvent.blur(first);
    await userEvent.click(screen.getByRole("button", { name: "Alternativ för tanke 1" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Flytta höger" }));
    await userEvent.click(screen.getByRole("button", { name: "Listvy" }));
    expect(screen.getByLabelText("Tanke 1")).toHaveValue("Ta en promenad");
    await userEvent.click(screen.getByRole("button", { name: "Kartvy" }));
    expect(screen.getByLabelText("Tanke 1")).toHaveValue("Ta en promenad");
    const node = saved.entities().find((entry) => entry.kind === "node")!;
    expect(node.content).toMatchObject({ text: "Ta en promenad", x: 46, y: 24, bookId: "page" });
    expect(node.heads).toHaveLength(1);
    expect(node.revisions.length).toBeGreaterThan(1);
  });
  it("connects two thoughts once, guards reverse duplicates and retains node text on deletion", async () => {
    const saved = setup("map");
    await userEvent.click(screen.getByRole("button", { name: "Ny tanke" }));
    fireEvent.change(screen.getByLabelText("Tanke 1"), { target: { value: "Promenad" } });
    await userEvent.click(screen.getByRole("button", { name: "Ny tanke" }));
    expect(screen.getByLabelText("Tanke 2")).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Tanke 2"), { target: { value: "Skogen" } });
    await userEvent.click(screen.getByText("Koppla tankar"));
    const nodes = saved.entities().filter((entry) => entry.kind === "node");
    fireEvent.change(screen.getByLabelText("Från tanke"), { target: { value: nodes[0].id } });
    fireEvent.change(screen.getByLabelText("Till tanke"), { target: { value: nodes[1].id } });
    await userEvent.click(screen.getByRole("button", { name: "Koppla ihop" }));
    expect(saved.entities().filter((entry) => entry.kind === "edge")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Från tanke"), { target: { value: nodes[1].id } });
    fireEvent.change(screen.getByLabelText("Till tanke"), { target: { value: nodes[0].id } });
    await userEvent.click(screen.getByRole("button", { name: "Koppla ihop" }));
    expect(saved.entities().filter((entry) => entry.kind === "edge")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Alternativ för tanke 2" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Ta bort tanke" }));
    expect(screen.queryByRole("button", { name: "Ta bort koppling" })).toBeNull();
    expect(saved.entities().find((entry) => entry.content.text === "Skogen")?.content.deleted).toBe(
      true,
    );
  });
  it("keeps zoom bounded and resets the map position", async () => {
    setup("map");
    for (let i = 0; i < 3; i++)
      await userEvent.click(screen.getByRole("button", { name: "Zooma ut" }));
    expect(screen.getByRole("button", { name: "Zooma ut" })).toBeDisabled();
    expect(screen.getByLabelText("Zoomnivå")).toHaveTextContent("50 %");
    await userEvent.click(screen.getByRole("button", { name: "Visa översikt" }));
    expect(screen.getByLabelText("Zoomnivå")).toHaveTextContent("100 %");
  });
});

describe("Dagbokens papperssida", () => {
  it("keeps labelled date/title/writing, autosaves and switches reading style without changing text", async () => {
    const saved = setup("diary");
    fireEvent.change(screen.getByLabelText("Datum"), { target: { value: "2026-10-17" } });
    fireEvent.change(screen.getByLabelText("Rubrik, om du vill"), { target: { value: "Lördag" } });
    fireEvent.change(screen.getByLabelText("Dina ord"), { target: { value: "Några egna ord." } });
    await userEvent.click(screen.getByRole("button", { name: "Vanlig lässtil" }));
    expect(screen.getByLabelText("Dina ord")).toHaveValue("Några egna ord.");
    expect(screen.getByRole("button", { name: "Handskriftsstil" })).toBeTruthy();
    await waitFor(() =>
      expect(saved.entities()[0].content).toMatchObject({
        title: "Lördag",
        text: "Några egna ord.",
        date: "2026-10-17",
      }),
    );
  });
  it("copies only selected words with a source link and leaves the diary text intact", async () => {
    const saved = setup("diary");
    const text = screen.getByLabelText("Dina ord") as HTMLTextAreaElement;
    text.setSelectionRange(0, 3);
    fireEvent.select(text);
    await userEvent.click(screen.getByRole("button", { name: "Kopiera markerad text" }));
    fireEvent.change(screen.getByLabelText("Bokdel"), { target: { value: "map" } });
    await userEvent.click(screen.getByRole("button", { name: "Bekräfta kopia" }));
    expect(saved.entities().find((entry) => entry.kind === "node")?.content).toMatchObject({
      text: "Tid",
      source: { entryId: "page", quote: "Tid" },
    });
    expect(saved.entities().find((entry) => entry.id === "page")?.content.text).toBe(content.text);
    expect(text).toHaveValue(content.text);
  });
});
