import { describe, expect, it } from "vitest";
import {
  alternativesAfter,
  detectCategory,
  questionsFor,
  strategiesFor,
  summarize,
} from "./situation-helper";

const banned = /för att barnet|det betyder att|det beror på/i;

describe("situation-helper", () => {
  it("svårt att komma iväg: tidsfråga först, 3–5 vägar", () => {
    expect(questionsFor("komma-ivag")[0]!.id).toBe("tid");
    const s = strategiesFor("komma-ivag");
    expect(s.length).toBeGreaterThanOrEqual(3);
    expect(s.length).toBeLessThanOrEqual(5);
  });
  it("hoppar över tidsfråga när tid står i texten", () => {
    expect(questionsFor("komma-ivag", "Vi ska gå om 20 minuter").some((q) => q.id === "tid")).toBe(false);
    expect(summarize({ text: "om 20 minuter", category: "komma-ivag", who: "Bella", answers: {} }).minutes).toBe(20);
  });
  it("klä på sig, mat, kväll, känslor detekteras", () => {
    expect(detectCategory("Barnet vägrar klä på sig")).toBe("komma-ivag");
    expect(detectCategory("Hon vill inte äta")).toBe("mat");
    expect(detectCategory("Läggdags tar en evighet")).toBe("kvall");
    expect(detectCategory("Han får utbrott")).toBe("kanslor");
    expect(detectCategory("jag vet inte")).toBeNull();
  });
  it("starka känslor börjar med lugn", () => {
    expect(strategiesFor("kanslor")[0]!.id).toBe("lugn");
    expect(questionsFor("kanslor").length).toBeLessThanOrEqual(3);
  });
  it("utan tidspress", () => {
    const s = summarize({ text: "", category: "mat", who: "Bella", answers: { tid: "ingen" } });
    expect(s.time).toBe("Ingen tydlig tidspress");
  });
  it("två barn och förälder", () => {
    expect(summarize({ text: "", category: "konflikt", who: "Bella och Sam", answers: {} }).sentence).toContain("Bella och Sam");
    expect(summarize({ text: "", category: "annat", who: "Du", answers: {} }).sentence).toContain("dig");
  });
  it("det fungerade inte → nya vägar utan upprepning", () => {
    const alt = alternativesAfter(["tva-val", "mindre"], "komma-ivag");
    expect(alt.some((a) => a.id === "mindre" || a.id === "tva-val")).toBe(false);
    expect(alt.length).toBeGreaterThan(0);
  });
  it("inga diagnostiserande formuleringar", () => {
    for (const s of strategiesFor("komma-ivag")) expect(`${s.steps.join(" ")} ${s.say}`).not.toMatch(banned);
    expect(summarize({ text: "", category: "overgang", who: "Bella", answers: { forvarnat: "nej" } }).sentence).not.toMatch(banned);
  });
});
