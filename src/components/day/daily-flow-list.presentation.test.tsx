import { useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FlowItem } from "@/lib/flow-items";
import DailyFlowList from "./daily-flow-list";

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
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: Record<string, string[]>) => useState(initial) }));
vi.mock("@/components/flow-item-actions", () => ({
  FlowItemActions: ({ className }: { className?: string }) => <button aria-label="Fler val" className={className} />,
  kindFromId: () => ({ kind: "uppgift", realId: "test" }),
}));
vi.mock("@/components/myflove/motion", () => ({ MyFloveTransition: ({ children }: { children: ReactNode }) => <div data-testid="legacy-transition">{children}</div> }));
vi.mock("@/components/adaptive-activity-card", () => ({ default: () => null }));

describe("Today-only activity presentation", () => {
  it("keeps completion, read-only family rows, ordering and accessible controls", () => {
    const completed = vi.fn();
    const { container } = render(<DailyFlowList presentation="integrated" dayHeadings onCompleted={completed} />);
    expect(screen.getByText(rows[0].title)).toHaveClass("line-through");
    expect(screen.getByText(rows[1].title)).not.toHaveClass("line-through");
    expect(screen.getAllByRole("button", { name: "Fler val" })[0]).toHaveClass("h-11", "w-11");
    expect(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` })).toHaveClass("h-11", "w-11");
    expect(screen.queryByRole("button", { name: /Klarmarkera Familjens schema/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".shadow-sm")).toHaveLength(0);
    expect(container.querySelectorAll('[style*="border-left"]')).toHaveLength(0);
    expect(screen.queryByTestId("legacy-transition")).not.toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("li p")).map(p => p.textContent)).toEqual(rows.map(row => row.title));
    fireEvent.click(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` }));
    expect(screen.getByText(rows[1].title)).toHaveClass("line-through");
    expect(completed).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: `Ångra ${rows[1].title}` }));
    expect(screen.getByText(rows[1].title)).not.toHaveClass("line-through");
    expect(completed).toHaveBeenCalledOnce();
  });

  it("leaves legacy card presentation as the default", () => {
    const { container } = render(<DailyFlowList />);
    expect(container.querySelectorAll(".shadow-sm")).toHaveLength(rows.length);
    expect(screen.getAllByTestId("legacy-transition")).toHaveLength(rows.length);
    expect(screen.getByRole("button", { name: `Klarmarkera ${rows[1].title}` })).toHaveClass("h-8", "w-8");
  });
});