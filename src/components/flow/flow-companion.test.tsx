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
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
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
  it("loggar exakt ett event när knappen öppnas", () => {
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    expect(sink).toHaveLength(1);
    expect(sink[0]!.name).toBe("flow_learning_opened");
    expect(sink[0]!.section).toBe("flow");
  });

  it("skickar aldrig känsliga råvärden i payloaden", () => {
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    expect(sink[0]!.payload).toEqual({ source: "flow-companion" });
    expect(JSON.stringify(sink[0])).not.toMatch(/mönster|energi|humör|medicin/i);
  });

  it("loggar inte eventet för andra Flow-länkar", () => {
    (moment as { learning?: boolean }).learning = false;
    render(<FlowCompanion />);
    fireEvent.click(screen.getByText("Vad jag lärt mig"));
    expect(sink).toHaveLength(0);
    (moment as { learning?: boolean }).learning = true;
  });
});
