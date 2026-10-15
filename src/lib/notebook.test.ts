import { describe, it, expect } from "vitest";
import {
  appendRevision,
  makeRevision,
  projectNotebook,
  linkedContent,
  movePoint,
  NOTEBOOK_KEY,
} from "./notebook";
import { mergeSyncValues, snapshotBase } from "./sync-merge";
import { isSensitiveKey } from "./secure-local";
import { CLOUD_USER_DATA_KEYS } from "./cloud-keys";
import { isUserDataKey } from "./account-scope";
const content = { title: "En tanke", text: "Originalet", date: "2026-10-15" };
describe("private notebook revisions", () => {
  it("registers encryption, sync and account separation", () => {
    expect(isSensitiveKey(NOTEBOOK_KEY)).toBe(true);
    expect(CLOUD_USER_DATA_KEYS.has(NOTEBOOK_KEY)).toBe(true);
    expect(isUserDataKey(NOTEBOOK_KEY)).toBe(true);
  });
  it("preserves concurrent branches", () => {
    const a = makeRevision("entry", "diary", content);
    const b = makeRevision("entry", "diary", { ...content, text: "Enhet A" }, [a.id]);
    const c = makeRevision("entry", "diary", { ...content, text: "Enhet B" }, [a.id]);
    const entity = projectNotebook([a, b, c])[0];
    expect(entity?.heads).toHaveLength(2);
    expect(entity?.revisions).toHaveLength(3);
  });
  it("resolves only via explicit parent heads while retaining history", () => {
    const a = makeRevision("entry", "diary", content);
    const b = makeRevision("entry", "diary", { ...content, text: "A" }, [a.id]);
    const c = makeRevision("entry", "diary", { ...content, text: "B" }, [a.id]);
    const d = makeRevision("entry", "diary", { ...content, text: "A och B" }, [b.id, c.id]);
    const entity = projectNotebook([a, b, c, d])[0];
    expect(entity?.heads).toHaveLength(1);
    expect(entity?.content.text).toBe("A och B");
    expect(entity?.revisions).toHaveLength(4);
  });
  it("id union through existing three-way merge retains both edits", () => {
    const a = makeRevision("entry", "diary", content);
    const b = makeRevision("entry", "diary", { ...content, text: "A" }, [a.id]);
    const c = makeRevision("entry", "diary", { ...content, text: "B" }, [a.id]);
    const merged = mergeSyncValues({
      local: [a, b],
      cloud: [a, c],
      base: snapshotBase([a]),
      removed: new Set<string>(),
      localUpdatedAt: 1,
      cloudUpdatedAt: 2,
    });
    expect(projectNotebook(merged)[0]?.heads).toHaveLength(2);
  });
  it("retries a revision id without duplicates", () => {
    const a = makeRevision("entry", "diary", content);
    expect(appendRevision([a], a)).toHaveLength(1);
  });
  it("copies text without changing source and keeps quote if source changes", () => {
    const quote = linkedContent(content.text, "entry", "decision");
    expect(content.text).toBe("Originalet");
    expect(quote.source).toEqual({ entryId: "entry", quote: "Originalet" });
    expect(quote.text).toBe("Originalet");
  });
  it("moves a point without losing its separate markings or quote", () => {
    const point = {
      ...linkedContent("Citat", "entry", "book"),
      starred: true,
      important: true,
      crossed: true,
    };
    expect(movePoint(point, "cons", 2)).toEqual({ ...point, column: "cons", order: 2 });
  });
  it("retains deleted pages as revisions", () => {
    const a = makeRevision("entry", "diary", content);
    const b = makeRevision("entry", "diary", { ...content, deleted: true }, [a.id]);
    const entity = projectNotebook([a, b])[0];
    expect(entity?.content.deleted).toBe(true);
    expect(entity?.revisions[0]?.content.text).toBe("Originalet");
  });
});
