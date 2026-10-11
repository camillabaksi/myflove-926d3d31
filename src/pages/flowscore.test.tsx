import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FlowScorePage from "./flowscore";

const capacity = vi.hoisted(() => ({ percent: 25 as number | null }));
vi.mock("@/hooks/use-day-capacity", () => ({ useDayCapacity: () => () => capacity }));
vi.mock("@/hooks/use-language", () => ({ useLang: () => ({ t: (text: string) => text }) }));
vi.mock("@/lib/day", () => ({ todayISO: () => "2026-10-11" }));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: (_key: string, value: unknown) => [value, vi.fn()],
}));
vi.mock("@/hooks/use-visual-calendar", () => ({
  useVisualCalendar: () => ({
    days: {
      "2026-10-11": [
        {
          id: "a",
          sourceId: "a",
          source: "task",
          date: "2026-10-11",
          title: "En uppgift",
          done: false,
          editable: true,
          energyImpact: "drains",
          friction: "small",
        },
      ],
    },
  }),
}));
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/myflove/block", () => ({
  MyFlovePageGrid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MyFloveWide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/simple-checkin", () => ({ default: () => null }));

afterEach(() => {
  capacity.percent = 25;
});

describe("Dagens balans", () => {
  it("visar samma egna kapacitet och en kvalitativ takt utan ett konkurrerande poängvärde", () => {
    render(<FlowScorePage />);
    expect(screen.getByText("25 %")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Varsamt" })).toBeVisible();
    expect(screen.queryByText(/minuter fokus är rimligt/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logga energi & mående" })).toBeVisible();
  });
  it("gissar inte kapacitet när det saknas en registrering idag", () => {
    capacity.percent = null;
    render(<FlowScorePage />);
    expect(screen.getByRole("heading", { name: "Hur börjar du dagen?" })).toBeVisible();
    expect(screen.queryByText(/\d+ %/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Varsamt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Jämnt" })).not.toBeInTheDocument();
  });
});
