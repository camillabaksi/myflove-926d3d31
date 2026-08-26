import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TodayTasks from "@/components/today-tasks";
import type { FlowItem } from "@/lib/flow-items";

const toggleItem = vi.fn();

const item = (id: string, title: string, done: boolean): FlowItem =>
  ({
    id,
    title,
    done,
    completable: true,
    kind: "task",
    area: "vardag",
  }) as unknown as FlowItem;

let todayOpen: FlowItem[] = [];
let todayDone: FlowItem[] = [];

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/collapsible-section", () => ({
  default: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock("@/hooks/use-flow-items", () => ({
  useFlowItems: () => ({ todayOpen, todayDone, toggleItem }),
}));

describe("Dagens saker", () => {
  beforeEach(() => {
    toggleItem.mockClear();
    todayOpen = [item("1", "Diska", false), item("2", "Posta brev", false)];
    todayDone = [item("3", "Ta medicin", true)];
  });

  it("kompakt läge på Hem: ingen egen Gjort-lista, bara en väg till Min dag", () => {
    render(<TodayTasks limit={3} compact />);
    expect(screen.getByText("Diska")).toBeInTheDocument();
    expect(screen.queryByText("Ta medicin")).toBeNull();
    expect(screen.getByText(/1 sak genomförd/i)).toBeInTheDocument();
    expect(screen.getByText(/Se hela dagen/i)).toBeInTheDocument();
  });

  it("fullt läge har det samlade Gjort-läget", () => {
    render(<TodayTasks />);
    expect(screen.getByText(/1 sak genomförda idag/i)).toBeInTheDocument();
  });

  it("markerar en sak som klar via samma avbockning", () => {
    render(<TodayTasks limit={3} compact />);
    fireEvent.click(screen.getByRole("button", { name: /klarmarkera diska/i }));
    expect(toggleItem).toHaveBeenCalled();
  });
});
