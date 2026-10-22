import { useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { todayISO } from "@/lib/flow-items";
import type { FlowItem } from "@/lib/flow-items";
import DailyFlowList from "./daily-flow-list";
import FamilyDayPerspectives from "./family-day-perspectives";

const rows: FlowItem[] = [
  { id: "task-first", title: "En redan klar aktivitet", source: "uppgift", area: "vardag", time: "08:00", done: true, completable: true, priority: "idag", emoji: "" },
  { id: "task-second", title: "En mycket lång aktivitetstitel som behöver kunna fortsätta på flera rader utan att dölja meny eller checkbox", source: "uppgift", area: "studier", time: "14:00", done: false, completable: true, priority: "idag", emoji: "" },
  { id: "childitem-readonly", title: "Familjens schema", source: "barn", area: "barn", done: false, completable: false, priority: "idag", emoji: "" },
  { id: "task-untimed", title: "En aktivitet utan tid", source: "uppgift", area: "halsa", done: false, completable: true, priority: "idag", emoji: "" },
];

vi.mock("@/hooks/use-flow-items", () => ({
  useFlowItems: () => {
    const [today, setToday] = useState(rows);
    return { today, toggleItem: (item: FlowItem) => setToday(current => current.map(row => row.id === item.id ? { ...row, done: !row.done } : row)) };
  },
}));
const storedDayOrder = vi.hoisted(() => ({ value: null as Record<string, string[]> | null }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: Record<string, string[]>) => useState(storedDayOrder.value ?? initial) }));
vi.mock("@/components/flow-item-actions", () => ({
  FlowItemActions: ({ className }: { className?: string }) => <button aria-label="Fler val" className={className} />,
  kindFromId: () => ({ kind: "uppgift", realId: "test" }),
  useScrollSafeMenu: () => ({ menuOpen: false, setMenuOpen: vi.fn(), triggerProps: {} }),
}));
vi.mock("@/components/myflove/motion", () => ({ MyFloveTransition: ({ children }: { children: ReactNode }) => <div data-testid="legacy-transition">{children}</div> }));
vi.mock("@/components/adaptive-activity-card", () => ({ default: () => null }));
vi.mock("@/hooks/use-children", () => ({
  useChildren: () => ({ children: [{ id: "bella", name: "Bella" }, { id: "bianca", name: "Bianca" }], items: [], updateItem: vi.fn() }),
}));
vi.mock("@/hooks/use-child-events", () => ({
  useChildEvents: () => [
    { childId: "bella", childName: "Bella", itemId: "wake-bella", title: "Vakna Bella", time: "05:30", requiresParent: true },
    { childId: "bianca", childName: "Bianca", itemId: "breakfast-bianca", title: "Frukost Bianca", time: "06:15", requiresParent: true },
  ],
}));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ updateTask: vi.fn(), toggleTask: vi.fn() }) }));

describe("Compact day activity presentation", () => {
  beforeEach(() => { storedDayOrder.value = null; });
  it("keeps completion, read-only family rows, ordering and accessible controls", () => {
    const completed = vi.fn();
    const { container } = render(<DailyFlowList presentation="integrated" dayHeadings onCompleted={completed} />);
    expect(screen.getByText(rows[0].title)).toHaveClass("line-through");
    expect(screen.getByText(rows[1].title)).not.toHaveClass("line-through");
    expect(screen.getAllByRole("button", { name: "Fler val" })[0]).toHaveClass("h-11", "w-11");
    expect(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` })).toHaveClass("h-9", "w-9");
    expect(screen.queryByRole("button", { name: /Klarmarkera Familjens schema/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".shadow-sm")).toHaveLength(0);
    expect(container.querySelectorAll('[style*="border-left"]')).toHaveLength(rows.length);
    expect(screen.queryByTestId("legacy-transition")).not.toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("li p")).map(p => p.textContent)).toEqual(rows.map(row => row.title));
    fireEvent.click(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` }));
    expect(screen.getByText(rows[1].title)).toHaveClass("line-through");
    expect(completed).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: `Ångra ${rows[1].title}` }));
    expect(screen.getByText(rows[1].title)).not.toHaveClass("line-through");
    expect(completed).toHaveBeenCalledOnce();
  });

  it("shows independent same-titled tasks separately but one source projection only once", () => {
    const sameTitleDifferentTask: FlowItem = { ...rows[1]!, id: "task-separate" };
    render(<DailyFlowList presentation="integrated" extraItems={[sameTitleDifferentTask, { ...rows[1]! }, { ...sameTitleDifferentTask }]} />);
    // Two genuinely separate tasks, even if both were planned for 14:00.
    expect(screen.getAllByText(rows[1]!.title)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: `Klarmarkera ${rows[1]!.title}` })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Fler val" })).toHaveLength(rows.length + 1);
  });

  it("reads an existing title-based day order without migrating storage", () => {
    const legacyKey = `${rows[3]!.title.toLocaleLowerCase("sv")}|`;
    storedDayOrder.value = { [todayISO()]: [legacyKey] };
    render(<DailyFlowList presentation="integrated" />);
    expect(screen.getAllByRole("listitem").map(li => li.textContent).filter(Boolean)[0]).toContain(rows[3]!.title);
    // The other three items stay visible and retain their individual source IDs.
    for (const row of rows) expect(screen.getByText(row.title)).toBeInTheDocument();
  });

  it("leaves legacy card presentation as the default", () => {
    const { container } = render(<DailyFlowList />);
    expect(container.querySelectorAll(".shadow-sm")).toHaveLength(rows.length);
    expect(screen.getAllByTestId("legacy-transition")).toHaveLength(rows.length);
    expect(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` })).toHaveClass("h-8", "w-8");
  });

  it("keeps calendar family projections read-only with compact pictograms", () => {
    const completed = vi.fn();
    const shared: FlowItem = { id: "childitem-shared", title: "Delad familjeaktivitet", source: "barn", area: "barn", time: "16:00", done: true, completable: true, priority: "idag", emoji: "" };
    render(<DailyFlowList date="2026-10-10" extraItems={[shared]} presentation="integrated" showPictograms onCompleted={completed} />);
    expect(screen.getByText(shared.title)).not.toHaveClass("line-through");
    expect(screen.queryByRole("button", { name: `Klarmarkera ${shared.title}` })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Ångra ${shared.title}` })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` }));
    expect(completed).toHaveBeenCalledWith(rows[1]);
    expect(screen.getByText(rows[1].title)).toHaveClass("line-through");
  });

  it("keeps child schedules out of Min dag without hiding owned family tasks", () => {
    const own: FlowItem = { id: "task-pickup", title: "Hämta på förskolan", source: "uppgift", area: "barn", time: "16:00", completable: true, priority: "idag", emoji: "", linkedLabel: "Bella – Förskola" };
    const children: FlowItem[] = [
      { id: "childitem-breakfast", title: "Frukost (Bianca)", source: "barn", area: "barn", time: "06:15", priority: "idag", emoji: "" },
      { id: "child-legacy", title: "Vakna (Bella)", source: "kalender", area: "barn", time: "05:30", priority: "idag", emoji: "" },
      { ...own, id: "childitem-pickup", source: "barn" },
    ];
    const completed = vi.fn();
    render(<DailyFlowList includeChildSchedules={false} extraItems={[...children, own]} presentation="integrated" onCompleted={completed} />);

    expect(screen.queryByText("Familjens schema")).not.toBeInTheDocument();
    expect(screen.queryByText("Frukost (Bianca)")).not.toBeInTheDocument();
    expect(screen.queryByText("Vakna (Bella)")).not.toBeInTheDocument();
    expect(screen.getByText(own.title)).toBeInTheDocument();
    expect(screen.getByText(own.linkedLabel!)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Klarmarkera ${own.title}` }));
    expect(completed).toHaveBeenCalledWith(own);
  });

  it("shows only the selected person's day and restores Min dag after viewing children or family", () => {
    render(<FamilyDayPerspectives myDay={<DailyFlowList includeChildSchedules={false} presentation="integrated" />} />);
    expect(screen.getByRole("radio", { name: "Min dag" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(rows[1].title)).toBeInTheDocument();
    expect(screen.queryByText(rows[2].title)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Bella" }));
    expect(screen.getByText("Vakna Bella")).toBeInTheDocument();
    expect(screen.queryByText("Frukost Bianca")).not.toBeInTheDocument();
    expect(screen.queryByText(rows[1].title)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Markera som klar/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Bianca" }));
    expect(screen.getByText("Frukost Bianca")).toBeInTheDocument();
    expect(screen.queryByText("Vakna Bella")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Familj" }));
    // Family has separate mobile and desktop renderings of the same timeline.
    expect(screen.getAllByText("Vakna Bella")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Frukost Bianca")[0]).toBeInTheDocument();
    expect(screen.getAllByText(rows[1].title)[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Min dag" }));
    expect(screen.queryByText("Vakna Bella")).not.toBeInTheDocument();
    expect(screen.queryByText("Frukost Bianca")).not.toBeInTheDocument();
    expect(screen.queryByText(rows[2].title)).not.toBeInTheDocument();
    expect(screen.getByText(rows[1].title)).toBeInTheDocument();
  });

  it("filters the visible rows only, without changing data or completion", () => {
    render(<DailyFlowList presentation="integrated" showFilter includeChildSchedules={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Filtrera" }));
    const group = screen.getByRole("group", { name: "Filtrera dagens aktiviteter" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alla" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Med tid" }));
    expect(screen.getByRole("button", { name: "Med tid" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(rows[0].title)).toBeInTheDocument();
    expect(screen.getByText(rows[1].title)).toBeInTheDocument();
    expect(screen.queryByText(rows[3].title)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Viktigast" }));
    expect(screen.queryByText(rows[1].title)).not.toBeInTheDocument();
    expect(screen.getByText("Inget är markerat som viktigast just nu.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Alla" }));
    expect(screen.getByText(rows[3].title)).toBeInTheDocument();
    // Avbockning fungerar fortfarande efter filtrering.
    fireEvent.click(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` }));
    expect(screen.getByText(rows[1].title)).toHaveClass("line-through");
  });

  it("hides the filter unless showFilter is requested", () => {
    render(<DailyFlowList presentation="integrated" includeChildSchedules={false} />);
    expect(screen.queryByRole("group", { name: "Filtrera dagens aktiviteter" })).not.toBeInTheDocument();
  });
});
