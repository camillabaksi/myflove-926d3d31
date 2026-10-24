import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "./testa";

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
vi.mock("@/components/landing/public-page", () => ({
  PublicPage: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/lib/tester-recruitment.functions", () => ({
  submitTesterApplicationFn: mocks.submit,
}));

const TesterPage = Route.options.component as ComponentType;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.submit.mockResolvedValue({ ok: true });
});

describe("Intresseanmälan – plattformsanpassad e-postadress", () => {
  it.each(["android", "both"] as const)(
    "förklarar att %s kräver Google Play-kontots adress",
    (platform) => {
      render(<TesterPage />);
      fireEvent.change(screen.getByLabelText("Vilken enhet vill du testa på? *"), {
        target: { value: platform },
      });
      const input = screen.getByLabelText("E-postadress kopplad till ditt Google Play-konto *");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toBeRequired();
      expect(input).toHaveAttribute("aria-describedby", "tester-email-help");
      expect(screen.getByText(/samma e-postadress som du använder i Google Play Butik/)).toBeInTheDocument();
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    },
  );

  it.each(["ios", "web"] as const)(
    "visar vanlig mejladress för %s och inget Google Play-krav",
    (platform) => {
      render(<TesterPage />);
      fireEvent.change(screen.getByLabelText("Vilken enhet vill du testa på? *"), {
        target: { value: platform },
      });
      expect(screen.getByLabelText("Din mejladress *")).toBeRequired();
      expect(screen.queryByText(/samma e-postadress som du använder i Google Play Butik/)).not.toBeInTheDocument();
    },
  );

  it("använder samma insamlade adress i anmälan, utan extra fält eller nya serverparametrar", async () => {
    render(<TesterPage />);
    fireEvent.change(screen.getByLabelText("Vilken enhet vill du testa på? *"), {
      target: { value: "android" },
    });
    fireEvent.change(screen.getByLabelText("E-postadress kopplad till ditt Google Play-konto *"), {
      target: { value: "testkonto@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hur vill du hjälpa till? *"), {
      target: { value: "everyday" },
    });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByRole("button", { name: /Jag vill testa Paceable/ }));
    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "testkonto@example.com",
          platform: "android",
          participation: "everyday",
          consent: true,
          adult: true,
        }),
      }),
    );
    expect(mocks.submit).toHaveBeenCalledTimes(1);
  });
});
