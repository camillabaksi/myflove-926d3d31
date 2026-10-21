import { describe, expect, it } from "vitest";
import { appendSpaceRevision, makeSpaceRevision, maySendSpaceNote, spaceHeads, validSpaceDate } from "./day-space";
import { mergeValues } from "./sync-merge";

describe("private daily space rules", () => {
  it("accepts a local calendar date and rejects impossible dates", () => {
    expect(validSpaceDate("2026-10-21")).toBe(true);
    expect(validSpaceDate("2026-02-30")).toBe(false);
  });
  it("stores free text without requiring a category or energy", () => {
    const revision = makeSpaceRevision("2026-10-21", "En oväntad stund", [], []);
    expect(revision.text).toBe("En oväntad stund");
    expect(revision.categories).toEqual([]);
    expect(Object.keys(revision).sort()).toEqual(["categories", "createdAt", "date", "id", "parents", "text"]);
  });
  it("keeps each date separate", () => {
    const a = makeSpaceRevision("2026-10-21", "Idag", [], []);
    const b = makeSpaceRevision("2026-10-20", "Igår", [], []);
    expect(spaceHeads([a,b], "2026-10-21").map(r => r.text)).toEqual(["Idag"]);
  });
  it("preserves concurrent branches and historical text", () => {
    const original = makeSpaceRevision("2026-10-21", "Original", [], []);
    const a = makeSpaceRevision(original.date, "Enhet A", [], [original.id]);
    const b = makeSpaceRevision(original.date, "Enhet B", [], [original.id]);
    const merged = mergeValues([original,a], [original,b], [original]) as typeof original[];
    expect(spaceHeads(merged, original.date).map(r => r.text).sort()).toEqual(["Enhet A", "Enhet B"]);
    expect(merged.find(r => r.id === original.id)?.text).toBe("Original");
    const resolved = makeSpaceRevision(original.date, "Mitt val", [], [a.id,b.id]);
    expect(spaceHeads(appendSpaceRevision(merged,resolved), original.date).map(r => r.text)).toEqual(["Mitt val"]);
  });
  it("does not invent a first empty note", () => {
    expect(appendSpaceRevision([],makeSpaceRevision("2026-10-21", "", [], []))).toEqual([]);
  });
  it("allows clearing text without deleting historical revisions", () => {
    const original=makeSpaceRevision("2026-10-21","Privat",[],[]);
    const cleared=makeSpaceRevision(original.date,"",[],[original.id]);
    const rows=appendSpaceRevision([original],cleared);
    expect(spaceHeads(rows,original.date)[0]?.text).toBe("");
    expect(rows.find(r=>r.id===original.id)?.text).toBe("Privat");
  });
  it("never transmits private text while the privacy boundary is unverified, even with consent", () => {
    expect(maySendSpaceNote(true,"A","A","2026-10-21","2026-10-21")).toBe(false);
    expect(maySendSpaceNote(false,"A","A","2026-10-21","2026-10-21")).toBe(false);
  });
});