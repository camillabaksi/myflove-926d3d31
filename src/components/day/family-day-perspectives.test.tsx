import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChildItem } from "@/hooks/use-children";
import { decodeVisualNotes, encodeVisualNotes } from "@/lib/child-visual-schedule";
import FamilyDayPerspectives from "./family-day-perspectives";
import { FAMILY_ID } from "./person-switcher";

const fixture = vi.hoisted(() => ({ items: [] as ChildItem[], updateItem: vi.fn(), toggleTask: vi.fn() }));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({
  children: [{ id: "bianca", name: "Bianca" }, { id: "bella", name: "Bella" }],
  items: fixture.items, updateItem: fixture.updateItem,
}) }));
vi.mock("@/hooks/use-child-events", () => ({ useChildEvents: () => fixture.items.map(item => ({
  childId: item.child_id, childName: item.child_id, itemId: item.id,
  title: item.title, time: item.time!.slice(0, 5),
  ...decodeVisualNotes(item.notes).meta,
})) }));
vi.mock("@/hooks/use-flow-items", () => ({ useFlowItems: () => ({ today: [] }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ updateTask: vi.fn(), toggleTask: fixture.toggleTask }) }));
vi.mock("@/lib/child-visual-schedule", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/child-visual-schedule")>(), localNowMinutes: () => 6 * 60 + 30,
}));

function item(id: string, title: string, time: string, childId = "bianca", linkGroup = "family"): ChildItem {
  return { id, child_id: childId, owner_id: "owner", kind: "activity", title, date: "2026-10-01", time,
    repeat: "daily", notes: encodeVisualNotes({ pictogram: "breakfast", category: id.endsWith("a") ? "familj" : "mat", tone: "sun", linkGroup }, `Privat anteckning ${id}`),
    completed: true, remind: false, file_path: null, created_at: "", updated_at: "", sharedWith: [], shareNotify: {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fixture.items = [item("wake-a", "Vakna", "05:30"), item("wake-b", "Vakna", "05:30"),
    item("breakfast-a", "Frukost", "06:15"), item("breakfast-b", "Frukost", "06:15"),
    item("dress-a", "Klä på sig", "06:45", "bianca", "dress"), item("dress-b", "Klä på sig", "06:45", "bianca", "dress"),
    item("bella", "Frukost", "06:15", "bella")];
  fixture.updateItem.mockImplementation(async (id: string, patch: Partial<ChildItem>) => {
    fixture.items = fixture.items.map(row => row.id === id ? { ...row, ...patch } : row);
  });
});

describe("Barnets dag med dubbla sparade poster", () => {
  it("shows a shared activity once, with both names, and filters the names with the selected children", () => {
    const { container } = render(<FamilyDayPerspectives defaultPerspective={FAMILY_ID} myDay={null} />);
    expect(screen.getAllByText("Frukost")).toHaveLength(1);
    const shared = screen.getByText("Frukost").closest("li")!;
    expect(shared).toHaveTextContent("Bianca · Bella");
    expect(shared).not.toHaveTextContent("Privat anteckning");
    expect(container.querySelectorAll("ol")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Bella$/ }));
    expect(screen.getAllByText("Frukost")).toHaveLength(1);
    expect(screen.getByText("Frukost").closest("li")).not.toHaveTextContent("Bianca · Bella");
    expect(screen.queryByRole("button", { name: /Markera som klar/ })).not.toBeInTheDocument();
  });
  it("visar varje hållpunkt en gång, med Nu/Nästa och kopplingar kvar", () => {
    render(<FamilyDayPerspectives defaultPerspective="bianca" myDay={<p>Egna dagen</p>} />);
    for (const title of ["Vakna", "Frukost", "Klä på sig"]) expect(screen.getAllByText(title)).toHaveLength(1);
    expect(within(screen.getByText("Frukost").closest("li")!).getByText("Nu")).toBeInTheDocument();
    expect(within(screen.getByText("Klä på sig").closest("li")!).getByText("Nästa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Markera som klar/ })).not.toBeInTheDocument();
    expect(fixture.updateItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "Bella" }));
    expect(screen.getAllByText("Frukost")).toHaveLength(1);
    expect(screen.queryByText("Vakna")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Min dag" }));
    expect(screen.getByText("Egna dagen")).toBeInTheDocument();
  });

  it("ändrar tiden på båda versionerna utan att ändra andra barn eller privata anteckningar", async () => {
    const user = userEvent.setup();
    const before = fixture.items.map(row => ({ ...row }));
    const view = render(<FamilyDayPerspectives defaultPerspective="bianca" myDay={null} />);
    await user.click(screen.getByRole("button", { name: "Fler val för Frukost" }));
    await user.click(screen.getByRole("menuitem", { name: /Ändra tid/ }));
    fireEvent.change(screen.getByLabelText("Ny tid"), { target: { value: "06:20" } });
    await user.click(screen.getByRole("button", { name: "Bara denna" }));
    expect(fixture.updateItem.mock.calls.map(([id, patch]) => [id, patch])).toEqual([
      ["breakfast-a", { time: "06:20" }], ["breakfast-b", { time: "06:20" }],
    ]);
    expect(fixture.items.find(row => row.id === "bella")).toEqual(before.find(row => row.id === "bella"));
    expect(fixture.items.map(row => row.notes)).toEqual(before.map(row => row.notes));
    view.rerender(<FamilyDayPerspectives defaultPerspective="bianca" myDay={null} />);
    expect(screen.getAllByText("Frukost")).toHaveLength(1);
    expect(within(screen.getByText("Frukost").closest("li")!).getByText("06:20")).toBeInTheDocument();
  });

  it("tar bort kopplingen från båda kopiorna och behåller anteckningar och andra barns kopplingar", async () => {
    const user = userEvent.setup();
    const before = fixture.items.map(row => ({ ...row }));
    render(<FamilyDayPerspectives defaultPerspective="bianca" myDay={null} />);
    await user.click(screen.getByRole("button", { name: "Fler val för Frukost" }));
    await user.click(screen.getByRole("menuitem", { name: /Ta bort koppling/ }));
    expect(fixture.updateItem.mock.calls.map(([id]) => id)).toEqual(["breakfast-a", "breakfast-b"]);
    for (const id of ["breakfast-a", "breakfast-b"]) {
      const notes = fixture.items.find(row => row.id === id)!.notes;
      expect(decodeVisualNotes(notes).meta.linkGroup).toBeUndefined();
      expect(decodeVisualNotes(notes).note).toBe(decodeVisualNotes(before.find(row => row.id === id)!.notes).note);
    }
    expect(fixture.items.find(row => row.id === "bella")).toEqual(before.find(row => row.id === "bella"));
  });
});
