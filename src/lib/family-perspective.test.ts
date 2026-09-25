import { describe, expect, it } from "vitest";
import type { ChildEvent } from "@/hooks/use-child-events";
import {
  buildParallelTimeline,
  childEventsForMyDay,
  entriesFromChildEvents,
  hasTimeMismatch,
  linkLabelsByTask,
  linkedSiblings,
  ME_ID,
  nowNextFor,
  type TimelineEntry,
} from "@/lib/family-perspective";
import { withLinkMeta } from "@/lib/activity-links";
import { decodeVisualNotes, encodeVisualNotes } from "@/lib/child-visual-schedule";
import { buildFamilyLoad } from "@/lib/family-load";

const ev = (p: Partial<ChildEvent> & Pick<ChildEvent, "time" | "title" | "childId">): ChildEvent => ({
  childName: p.childId === "b1" ? "Bella" : "Bianca",
  itemId: `${p.childId}-${p.title}-${p.time}`,
  ...p,
});
const me = (time: string, title: string, taskId: string): TimelineEntry => ({ key: `task-${taskId}`, personId: ME_ID, time, title, taskId });

describe("Min dag", () => {
  it("visar inga barnaktiviteter som inte kräver föräldern", () => {
    expect(childEventsForMyDay([ev({ childId: "b1", time: "08:30", title: "Förskola" })], new Set())).toHaveLength(0);
  });
  it("visar en relevant barnaktivitet som kräver föräldern", () => {
    const out = childEventsForMyDay([ev({ childId: "b1", time: "16:30", title: "Hämtas", requiresParent: true })], new Set());
    expect(out).toHaveLength(1);
  });
  it("visar inte barnaktiviteten när föräldern redan har en kopplad egen uppgift", () => {
    const e = ev({ childId: "b1", time: "13:45", title: "Doktor", requiresParent: true, parentTaskId: "t1" });
    expect(childEventsForMyDay([e], new Set(["t1"]))).toHaveLength(0);
    expect(linkLabelsByTask([e]).get("t1")).toBe("Bella – Doktor");
  });
});

describe("Parallell familjevy", () => {
  it("en förälder + ett barn", () => {
    const rows = buildParallelTimeline([me("09:00", "Jobb", "t"), ...entriesFromChildEvents([ev({ childId: "b1", time: "08:00", title: "Klä på sig" })])], [ME_ID, "b1"]);
    expect(rows.map((r) => r.time)).toEqual(["08:00", "09:00"]);
  });
  it("två barn med samma aktivitet blir en gemensam rad", () => {
    const entries = entriesFromChildEvents([
      ev({ childId: "b1", time: "08:30", title: "Förskola" }),
      ev({ childId: "b2", time: "08:30", title: "förskola" }),
    ]);
    const [row] = buildParallelTimeline(entries, [ME_ID, "b1", "b2"]);
    expect(row!.cells).toHaveLength(1);
    expect(row!.cells[0]!.personIds).toEqual(["b1", "b2"]);
  });
  it("två barn med olika aktiviteter blir separata celler", () => {
    const entries = entriesFromChildEvents([
      ev({ childId: "b1", time: "14:30", title: "Lek" }),
      ev({ childId: "b2", time: "14:30", title: "Simning" }),
    ]);
    expect(buildParallelTimeline(entries, ["b1", "b2"])[0]!.cells).toHaveLength(2);
  });
  it("gemensam middag för hela familjen via koppling", () => {
    const entries = [
      me("18:00", "Middag", "m"),
      ...entriesFromChildEvents([
        ev({ childId: "b1", time: "18:00", title: "Äta", parentTaskId: "m" }),
        ev({ childId: "b2", time: "18:00", title: "Middag" }),
      ]),
    ];
    const [row] = buildParallelTimeline(entries, [ME_ID, "b1", "b2"]);
    expect(row!.cells).toHaveLength(1);
    expect(row!.cells[0]!.linked).toBe(true);
  });
  it("filtrerar på valda personer", () => {
    const entries = entriesFromChildEvents([ev({ childId: "b1", time: "08:00", title: "A" }), ev({ childId: "b2", time: "09:00", title: "B" })]);
    expect(buildParallelTimeline(entries, ["b2"]).map((r) => r.time)).toEqual(["09:00"]);
  });
});

describe("Kopplingar", () => {
  const parent = me("13:45", "Ta Bella till doktorn", "t1");
  const [child] = entriesFromChildEvents([ev({ childId: "b1", time: "13:45", title: "Doktor", parentTaskId: "t1" })]);
  it("hittar kopplade aktiviteter åt båda håll", () => {
    expect(linkedSiblings(child!, [parent, child!])).toHaveLength(1);
    expect(linkedSiblings(parent, [parent, child!])).toHaveLength(1);
  });
  it("visar att tiden skiljer sig efter att bara ena ändrats", () => {
    const moved = { ...child!, time: "14:15" };
    expect(hasTimeMismatch(moved, [parent, moved])).toBe(true);
    expect(hasTimeMismatch(parent, [parent, child!])).toBe(false);
  });
  it("sparar och tar bort koppling utan att röra övrig metadata", () => {
    const notes = encodeVisualNotes({ pictogram: "doctor", category: "vård", tone: "blush", prepMinutes: 10 }, "Ta med kort");
    const linked = withLinkMeta(notes, { parentTaskId: "t1", linkGroup: "lg_abcd1234" });
    expect(decodeVisualNotes(linked).meta).toMatchObject({ parentTaskId: "t1", linkGroup: "lg_abcd1234", prepMinutes: 10 });
    const cleared = withLinkMeta(linked, { parentTaskId: null, linkGroup: null });
    const d = decodeVisualNotes(cleared);
    expect(d.meta.parentTaskId).toBeUndefined();
    expect(d.meta.linkGroup).toBeUndefined();
    expect(d.meta.pictogram).toBe("doctor");
    expect(d.note).toBe("Ta med kort");
  });
});

describe("Nu/Nästa", () => {
  it("väljer pågående och nästa utifrån tid", () => {
    const entries = [me("08:00", "A", "a"), me("09:00", "B", "b"), me("10:00", "C", "c")];
    expect(nowNextFor(entries, 8 * 60 + 30)).toEqual({ now: "task-a", next: "task-b" });
  });
});

describe("Förälderns kapacitet och tät eftermiddag", () => {
  const items = [
    { time: "16:15", title: "Hämta Bella", childName: "Bella", requiresParent: true },
    { time: "17:00", title: "Biancas simning", childName: "Bianca", requiresParent: true },
    { time: "18:30", title: "Middag", childName: "Bella", requiresParent: true },
    { time: "19:30", title: "Läggning", childName: "Bianca", requiresParent: true },
  ];
  it("låg batterinivå ger konkret förslag med förenklad middag och återhämtning", () => {
    const s = buildFamilyLoad({ items, batteryPercent: 35, capacity: "medel", nowMinutes: 12 * 60 });
    expect(s.suggestion).toContain("låg ork");
    expect(s.suggestion).toContain("förenkla middagen");
    expect(s.suggestion).toContain("20 min återhämtning efter hämta bella");
  });
  it("medel batteri ger mjukare förslag", () => {
    const s = buildFamilyLoad({ items, batteryPercent: 60, capacity: "medel", nowMinutes: 12 * 60 });
    expect(s.suggestion).not.toContain("batteri");
    expect(s.demanding).toBe(true);
  });
  it("hög batteri och lugn dag kräver inget", () => {
    const s = buildFamilyLoad({ items: [items[0]!], batteryPercent: 90, capacity: "hög", nowMinutes: 12 * 60 });
    expect(s.demanding).toBe(false);
  });
  it("ger aldrig energivärden på barnaktiviteter", () => {
    const s = buildFamilyLoad({ items, batteryPercent: 35, capacity: "låg", nowMinutes: 12 * 60 });
    expect(JSON.stringify(s)).not.toMatch(/-\d+ ?%/);
  });
});
