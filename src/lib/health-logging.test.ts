import { describe, expect, it } from "vitest";
import { isHealthObservation } from "@/lib/health-logging";
import { guessDestination, DESTINATION_AREA } from "@/lib/quickflow";
import { ANALYTICS_EVENTS, sanitizePayload, eventSection } from "@/lib/analytics-events";

/**
 * Produktregel: hälsologgning (energi, sömn, mående, kropp) är DATA och får
 * aldrig automatiskt bli en aktivitet i Idag/Planera/Kalender. Bara ett
 * aktivt användarval får skapa en aktivitet.
 */
describe("hälsologgning är data, inte aktivitet", () => {
  const HEALTH_TEXTS = [
    "Sov 5 timmar",
    "sovit dåligt inatt",
    "energi 35 %",
    "känner mig trött",
    "mår dåligt idag",
    "huvudvärk idag",
    "min kropp påverkar idag",
    "ont i ryggen",
    "väldigt stressad",
    "behöver återhämtning",
  ];

  it("1–4. energi, sömn, mående och kroppslig påverkan föreslås aldrig som uppgift eller kalender", () => {
    for (const text of HEALTH_TEXTS) {
      const d = guessDestination({ text });
      expect(d, text).not.toBe("uppgift");
      expect(d, text).not.toBe("kalender");
      expect(d, text).not.toBe("paminnelse");
    }
  });

  it("6. hälsoobservationer känns igen och pekas mot energi/mående-data", () => {
    for (const text of HEALTH_TEXTS) {
      expect(isHealthObservation(text), text).toBe(true);
    }
    expect(guessDestination({ text: "huvudvärk idag" })).toBe("energi");
    expect(guessDestination({ text: "Sov 5 timmar" })).toBe("energi");
  });

  it("5. hälsotexter blir inte en post i dagens lista (ingen uppgiftsdestination = inget livsområde)", () => {
    for (const text of HEALTH_TEXTS) {
      const d = guessDestination({ text });
      expect(DESTINATION_AREA[d], text).toBeUndefined();
    }
  });

  it("9. ett aktivt användarval kan fortfarande skapa en aktivitet", () => {
    // Användaren kan alltid välja destination själv i triagen – och riktiga
    // aktiviteter tolkas fortfarande som aktiviteter.
    expect(guessDestination({ text: "boka läkare" })).toBe("kalender");
    expect(guessDestination({ text: "träning kl 18" })).toBe("kalender");
    expect(guessDestination({ text: "ring vårdcentralen" })).toBe("kalender");
    expect(DESTINATION_AREA["halsa"]).toBeDefined();
  });

  it("8. ett förslag är bara ett förslag – det skapar inget i sig", () => {
    // guessDestination är en ren funktion utan sidoeffekter.
    const before = guessDestination({ text: "Sov 5 timmar" });
    const after = guessDestination({ text: "Sov 5 timmar" });
    expect(before).toBe(after);
  });
});

describe("analytics blandar inte ihop hälsologg och uppgift", () => {
  it("10a. hälsologgning har egna event, skilda från task_created", () => {
    expect(ANALYTICS_EVENTS).toContain("health_factor_logged");
    expect(ANALYTICS_EVENTS).toContain("battery_logged");
    expect(ANALYTICS_EVENTS).toContain("mood_logged");
    expect(eventSection("health_factor_logged")).toBe("halsa");
    expect(eventSection("task_created")).not.toBe(eventSection("health_factor_logged"));
  });

  it("10b. känsliga hälsovärden filtreras bort ur payload", () => {
    const payload = sanitizePayload({
      source: "ma-bra",
      method: "knapp",
      // Otillåtna nycklar – ska aldrig lämna klienten.
      level: 2,
      mood: 4,
      sleepHours: 5,
      note: "sov dåligt, ont i magen",
    } as Record<string, unknown>);
    expect(payload).toEqual({ source: "ma-bra", method: "knapp" });
  });
});
