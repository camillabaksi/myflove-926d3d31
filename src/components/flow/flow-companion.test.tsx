import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FlowMoment } from "@/hooks/use-flow-moment";

const moment: FlowMoment = {
  id: "learning-1",
  scene: "think",
  seed: 1,
  message: "Jag börjar se dina mönster.",
  learning: true,
  link: { href: "/insight", label: "Vad jag lärt mig" },
} as FlowMoment;

vi.mock("wouter", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/hooks/use-flow-moment", () => ({ useFlowMoment: () => moment }));
vi.mock("@/hooks/use-flow-learning", () => ({
  useFlowLearning: () => ({ level: 40, label: "Jag lär mig", insights: [] }),
}));
vi.mock("@/hooks/use-flow-settings", () => ({
  useFlowSettings: () => ({
    settings: { enabled: true, level: "diskret", learning: true },
    update: vi.fn(),
    dismiss: vi.fn(),
  }),
}));
vi.mock("@/components/flow/flow-character", () => ({
  FlowCharacter: () => <div data-testid="flow-character" />,
}));
vi.mock("@/lib/haptics", () => ({ haptic: vi.fn() }));

import { setAnalyticsSink, type AnalyticsSinkEvent } from "@/lib/analytics-events";
import { resetAnalyticsDedupe } from "@/lib/analytics";
const { default: FlowCompanion } = await import("@/components/flow/flow-companion");

let sink: AnalyticsSinkEvent[] = [];

beforeEach(() => {
  window.localStorage.clear();
  resetAnalyticsDedupe();
  sink = [];
  setAnalyticsSink((e) => sink.push(e));
});

describe("Flow-knappen 'Vad jag lärt mig'", () => {
  it("behåller samtalslänk och inställningar utan maskotens bildutrymme", () => {
    render(<FlowCompanion />);
    expect(screen.queryByTestId("flow-character")).toBeNull();
    expect(screen.getByRole("link", { name: "Prata med Pace" })).toHaveAttribute("href", "/assistant");
    expect(screen.getByRole("button", { name: "Hur mycket ska Pace hjälpa till?" })).toBeVisible();
  });
  it("loggar exakt ett event när knappen öppnas", () => {
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    const learning = sink.filter((e) => e.name === "flow_learning_opened");
    expect(learning).toHaveLength(1);
    expect(learning[0]!.section).toBe("flow");
  });

  it("skickar aldrig känsliga råvärden i payloaden", () => {
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    const learning = sink.filter((e) => e.name === "flow_learning_opened");
    expect(learning[0]!.payload).toEqual({ source: "flow-companion" });
    expect(JSON.stringify(sink)).not.toMatch(/mönster|humör|medicin/i);
  });

  it("loggar inte eventet för andra Flow-länkar", () => {
    (moment as { learning?: boolean }).learning = false;
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    expect(sink.filter((e) => e.name === "flow_learning_opened")).toHaveLength(0);
    (moment as { learning?: boolean }).learning = true;
  });
});
