import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const logMood = vi.fn();
const logEnergy = vi.fn();
const logEnergyPercent = vi.fn();
const addFactor = vi.fn(async () => undefined);
const trackCalls: { event: string; payload?: Record<string, unknown> }[] = [];

let checkinState: {
  moodValue: number | null;
  energyValue: number | null;
  todayMood: { id: string; score: number; note?: string; date: number } | null;
};

vi.mock("@/hooks/use-quick-checkin", () => ({
  useQuickCheckin: () => ({ ...checkinState, logMood, logEnergy, logEnergyPercent }),
}));
vi.mock("@/hooks/use-energy-flow", () => ({
  useEnergyFlow: () => ({ addFactor }),
}));
vi.mock("@/hooks/use-flow-explainer", () => ({
  useFlowExplainer: () => ({ explain: () => null }),
}));
vi.mock("@/lib/analytics", () => ({
  track: (event: string, payload?: Record<string, unknown>) => {
    trackCalls.push({ event, payload });
  },
}));

import SimpleCheckin from "@/components/simple-checkin";

describe("Mitt batteri – den kanoniska loggningsvyn", () => {
  beforeEach(() => {
    logMood.mockClear();
    logEnergy.mockReset();
    logEnergy.mockResolvedValue({ synced: true });
    addFactor.mockClear();
    trackCalls.length = 0;
    checkinState = { moodValue: null, energyValue: null, todayMood: null };
  });

  it("visar ett enda loggningsformulär med knappen 'Logga energi & mående'", () => {
    render(<SimpleCheckin />);
    expect(screen.getByTestId("battery-log-form")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Logga energi & mående/i })).toBeTruthy();
  });

  it("har fast rubrik och sparyta runt ett separat scrollbart innehåll i dialogläge", () => {
    render(<SimpleCheckin presentation="dialog" onCancel={() => undefined} />);

    expect(screen.getByTestId("checkin-dialog-header")).toHaveTextContent("Logga just nu");
    expect(screen.getByTestId("checkin-dialog-scroll")).toContainElement(
      screen.getByText("Hur mycket ryms idag?"),
    );
    expect(screen.getByTestId("checkin-dialog-footer")).toContainElement(
      screen.getByRole("button", { name: /^Logga energi & mående$/ }),
    );
    expect(screen.getByText("Två snabba frågor. Paceable gör resten.")).toHaveClass("sr-only");
  });

  it("behåller dialogens ifyllda val när hjälp och fördjupning öppnas", () => {
    render(<SimpleCheckin presentation="dialog" />);
    fireEvent.click(screen.getByRole("button", { name: "Lågt" }));
    fireEvent.click(screen.getByRole("button", { name: "Bra" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mitt dialogutkast" } });
    fireEvent.click(screen.getByRole("button", { name: "Visa mer" }));
    fireEvent.click(screen.getByRole("button", { name: /Sömn/ }));

    expect(screen.getByRole("button", { name: "Lågt" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bra" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox")).toHaveValue("Mitt dialogutkast");
    expect(screen.getByRole("button", { name: /Sömn/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^Logga energi & mående$/ })).toBeVisible();
  });

  it("låter användaren skriva fri text – men kräver den inte", async () => {
    render(<SimpleCheckin />);
    const field = screen.getByPlaceholderText(/Sovit bara 4 timmar/i);
    expect((field as HTMLTextAreaElement).required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    expect(logEnergy).toHaveBeenCalledTimes(1);
    await screen.findByText("Tack – din observation är sparad.");
  });

  it("sparar fritexten tillsammans med observationen i befintlig datamodell", async () => {
    render(<SimpleCheckin />);
    fireEvent.change(screen.getByPlaceholderText(/Sovit bara 4 timmar/i), {
      target: { value: "Jag sov bara 4 timmar och är dessutom sjuk." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    await waitFor(() =>
      expect(logMood).toHaveBeenCalledWith(
        expect.any(Number),
        "Jag sov bara 4 timmar och är dessutom sjuk.",
      ),
    );
  });

  it("skickar aldrig hälsotexten som analytics-payload", async () => {
    render(<SimpleCheckin />);
    fireEvent.change(screen.getByPlaceholderText(/Sovit bara 4 timmar/i), {
      target: { value: "Jag är sjuk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Logga energi & mående/i }));
    await waitFor(() => expect(logMood).toHaveBeenCalled());
    const serialized = JSON.stringify(trackCalls);
    expect(serialized).not.toContain("sjuk");
  });

  it("behåller osparade val och text över Visa mer och hopfällning utan autosparning", async () => {
    render(<SimpleCheckin />);
    fireEvent.click(screen.getByRole("button", { name: "Lågt" }));
    fireEvent.click(screen.getByRole("button", { name: "Bra" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mitt utkast" } });
    fireEvent.click(screen.getByRole("button", { name: "Visa mer" }));
    fireEvent.click(screen.getByRole("button", { name: /Sömn/ }));
    fireEvent.click(screen.getByRole("button", { name: "Visa mindre" }));
    fireEvent.click(screen.getByRole("button", { name: /Logga just nu/ }));
    fireEvent.click(screen.getByRole("button", { name: /Logga just nu/ }));
    expect(screen.getByRole("button", { name: "Lågt" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Bra" }).getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Mitt utkast");
    fireEvent.click(screen.getByRole("button", { name: "Visa mer" }));
    expect(screen.getByRole("button", { name: /Sömn/ }).getAttribute("aria-pressed")).toBe("true");
    expect(logEnergy).not.toHaveBeenCalled();
    expect(logMood).not.toHaveBeenCalled();
    expect(addFactor).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Logga energi & mående$/ }));
    await waitFor(() => expect(logMood).toHaveBeenCalledWith(expect.any(Number), "Mitt utkast"));
    expect(addFactor).toHaveBeenCalledWith(expect.objectContaining({ category: "somn" }));
  });

  it("flera loggningar samma dag är tillåtna – formuläret blockeras aldrig", async () => {
    // Användaren har redan loggat i morse.
    checkinState = {
      moodValue: 4,
      energyValue: 6,
      todayMood: { id: "m1", score: 2, note: "Tung morgon.", date: Date.now() },
    };
    render(<SimpleCheckin />);
    // Samma knapp, inget "du har redan loggat"-läge.
    const button = screen.getByRole("button", { name: /^Logga energi & mående$/i });
    expect(button).toBeTruthy();
    expect(screen.queryByText(/redan loggat/i)).toBeNull();
    fireEvent.click(button);
    expect(logEnergy).toHaveBeenCalledTimes(1);
    await screen.findByText("Tack – din observation är sparad.");
    // Formuläret är redo för nästa observation när sparningen är klar.
    expect(screen.getByRole("button", { name: /Logga energi & mående|Tack/i })).toBeTruthy();
  });
  it("väntar på sparningen innan dialogen stängs och hindrar dubbla tryck", async () => {
    let finish!: (result: { synced: boolean }) => void;
    logEnergy.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const onSaved = vi.fn();
    render(<SimpleCheckin presentation="dialog" onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: "Bra" }));
    const save = screen.getByRole("button", { name: /^Logga energi & mående$/ });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(save).toBeDisabled();
    expect(logEnergy).toHaveBeenCalledTimes(1);
    expect(logMood).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByText("Tack – din observation är sparad.")).toBeNull();
    await act(async () => finish({ synced: true }));
    expect(logMood).toHaveBeenCalledWith(8, undefined);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each(["card", "dialog"] as const)(
    "behåller utkastet och visar ett fel när sparningen misslyckas i %s",
    async (presentation) => {
      logEnergy.mockRejectedValue(new Error("Account changed"));
      const onSaved = vi.fn();
      render(<SimpleCheckin presentation={presentation} onSaved={onSaved} />);
      fireEvent.click(screen.getByRole("button", { name: "Lågt" }));
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mitt utkast" } });
      fireEvent.click(screen.getByRole("button", { name: /^Logga energi & mående$/ }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Dina val finns kvar");
      expect(screen.getByRole("textbox")).toHaveValue("Mitt utkast");
      expect(screen.getByRole("button", { name: "Lågt" })).toHaveAttribute("aria-pressed", "true");
      expect(onSaved).not.toHaveBeenCalled();
      expect(logMood).not.toHaveBeenCalled();
    },
  );

  it("berättar när observationen väntar på synkning", async () => {
    logEnergy.mockResolvedValue({ synced: false });
    render(<SimpleCheckin />);
    fireEvent.click(screen.getByRole("button", { name: /^Logga energi & mående$/ }));
    expect(await screen.findByText(/väntar på synkning till kontot/)).toBeVisible();
  });

  it("låter inte sena molnvärden skriva över valen i ett påbörjat utkast", async () => {
    const { rerender } = render(<SimpleCheckin />);
    fireEvent.click(screen.getByRole("button", { name: "Lågt" }));
    fireEvent.click(screen.getByRole("button", { name: "Bra" }));
    checkinState.energyValue = 10;
    checkinState.moodValue = 2;
    rerender(<SimpleCheckin />);
    expect(screen.getByRole("button", { name: "Lågt" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bra" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^Logga energi & mående$/ }));
    await waitFor(() => expect(logMood).toHaveBeenCalledWith(8, undefined));
    expect(logEnergy).toHaveBeenCalledWith(3);
  });
});

it("sparar en finjusterad procent bara efter Spara", async () => {
  logEnergyPercent.mockResolvedValue({ synced: true });
  logEnergyPercent.mockClear();
  render(<SimpleCheckin />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "57" } });
  expect(logEnergyPercent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Logga energi & mående" }));
  await waitFor(() => expect(logEnergyPercent).toHaveBeenCalledWith(57));
});
