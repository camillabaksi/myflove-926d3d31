import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { NotebookStore } from "./use-notebook";
import type { BookEntity, BookRevision } from "@/lib/notebook";
const mock = vi.hoisted(() => ({ owner: "A" }));
vi.mock("@/lib/account-scope", () => ({
  getDataOwner: () => mock.owner,
  isActiveOwner: (id: string) => id === mock.owner,
}));
vi.mock("@/lib/cloud-storage", () => ({
  useCloudSyncedStorage: () => [[], vi.fn()],
  useCloudSyncStatus: () => "saved",
  hasUnsyncedCloudData: () => false,
  syncKeyNow: vi.fn(),
}));
vi.mock("@/lib/secure-local", () => ({
  getSecureStatus: () => "ready",
  hasUnpersistedSecureWrites: () => false,
  SECURE_STATUS_EVENT: "secure",
}));
import { useBookDraft } from "./use-notebook";
function entity(text = "original", head = "r1"): BookEntity {
  const r: BookRevision = {
    id: head,
    entityId: "entry",
    kind: "diary",
    parents: [],
    createdAt: 1,
    content: { title: "", text, date: "2026-10-15" },
  };
  return { id: "entry", kind: "diary", content: r.content, heads: [r], revisions: [r] };
}
function store(): NotebookStore {
  return {
    entities: [],
    create: vi.fn(),
    status: "Synkat",
    retry: vi.fn(),
    save: vi.fn((id, kind, content, parents) => ({
      id: crypto.randomUUID(),
      entityId: id,
      kind,
      content,
      parents,
      createdAt: Date.now(),
    })),
  };
}
describe("notebook draft guards", () => {
  beforeEach(() => {
    mock.owner = "A";
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());
  it("autosaves after input and flushes on leaving", () => {
    const s = store();
    const { result, unmount } = renderHook(() => useBookDraft(entity(), s));
    act(() => result.current.update({ text: "ny text" }));
    act(() => vi.advanceTimersByTime(500));
    expect(s.save).toHaveBeenCalledWith(
      "entry",
      "diary",
      expect.objectContaining({ text: "ny text" }),
      ["r1"],
    );
    act(() => result.current.update({ text: "mer text" }));
    unmount();
    expect(s.save).toHaveBeenLastCalledWith(
      "entry",
      "diary",
      expect.objectContaining({ text: "mer text" }),
      expect.any(Array),
    );
  });
  it("never replaces active text with incoming sync", () => {
    const s = store();
    const { result, rerender } = renderHook(({ e }) => useBookDraft(e, s), {
      initialProps: { e: entity() },
    });
    act(() => result.current.update({ text: "mitt utkast" }));
    rerender({ e: entity("annat konto eller enhet", "r2") });
    expect(result.current.draft.text).toBe("mitt utkast");
    act(() => vi.advanceTimersByTime(500));
    expect(s.save).toHaveBeenCalledWith(
      "entry",
      "diary",
      expect.objectContaining({ text: "mitt utkast" }),
      ["r1"],
    );
  });
  it("stops delayed writes after owner changes", () => {
    const s = store();
    const { result, unmount } = renderHook(() => useBookDraft(entity(), s));
    act(() => result.current.update({ text: "privat A" }));
    mock.owner = "B";
    act(() => vi.advanceTimersByTime(500));
    unmount();
    expect(s.save).not.toHaveBeenCalled();
  });
  it("adopts remote updates only before writing starts", () => {
    const s = store();
    const { result, rerender } = renderHook(({ e }) => useBookDraft(e, s), {
      initialProps: { e: entity() },
    });
    rerender({ e: entity("ny version", "r2") });
    expect(result.current.draft.text).toBe("ny version");
  });
  it("ordinary editing does not silently resolve existing branches", () => {
    const s = store();
    const e = entity();
    const second = entity("andra texten", "r2");
    e.heads.push(second.heads[0] as BookRevision);
    const { result } = renderHook(() => useBookDraft(e, s));
    act(() => result.current.update({ text: "fortsättning" }));
    act(() => vi.advanceTimersByTime(500));
    expect(s.save).toHaveBeenCalledWith(
      "entry",
      "diary",
      expect.objectContaining({ text: "fortsättning" }),
      ["r1"],
    );
  });
});
