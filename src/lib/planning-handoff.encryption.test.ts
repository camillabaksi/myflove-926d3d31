import { beforeEach, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { installIndexedDbMock, resetIndexedDbMock } from "@/test/indexeddb-mock";
import { __resetSecureLocal, unlockSecureLocal } from "@/lib/secure-local";
import { DATA_OWNER_KEY } from "@/lib/account-scope";
import {
  clearPlanningHandoffs,
  readPlanningHandoff,
  persistPlanningHandoff,
  clearEncryptedPlanningHandoff,
  PLANNING_DRAFT_KEYS,
  type PlanningHandoff,
} from "@/lib/planning-handoff";

const draft: PlanningHandoff = {
  target: "me",
  period: "week",
  date: "2026-11-18",
  weekAnchor: "2026-11-18",
  selected: [],
  text: "Ett privat läkarbesök",
  rows: [{
    id: "saved-row-1",
    title: "Ett privat läkarbesök",
    date: "2026-11-18",
    time: "",
    endTime: "",
    location: "",
    childIds: [],
    childItemIds: {},
  }],
  periodAreas: {},
  stage: "review",
};

beforeEach(async () => {
  installIndexedDbMock();
  resetIndexedDbMock();
  localStorage.clear();
  __resetSecureLocal();
  clearPlanningHandoffs();
  localStorage.setItem(DATA_OWNER_KEY, "owner");
  await unlockSecureLocal();
});

describe("encrypted Planera recovery", () => {
  it("stores only ciphertext on disk and restores after a fresh JS session", async () => {
    readPlanningHandoff("owner", "me");
    persistPlanningHandoff("owner", "me", draft);
    await waitFor(() => expect(localStorage.getItem(PLANNING_DRAFT_KEYS.me)?.startsWith("enc:v1:")).toBe(true));
    expect(localStorage.getItem(PLANNING_DRAFT_KEYS.me)).not.toContain("läkarbesök");
    __resetSecureLocal();
    clearPlanningHandoffs();
    await unlockSecureLocal();
    expect(readPlanningHandoff("owner", "me")).toEqual(draft);
    expect(readPlanningHandoff("owner", "children")).toBeNull();
  });

  it("cannot hand an existing ciphertext snapshot to a different account", async () => {
    readPlanningHandoff("owner", "me");
    persistPlanningHandoff("owner", "me", draft);
    await waitFor(() => expect(localStorage.getItem(PLANNING_DRAFT_KEYS.me)?.startsWith("enc:v1:")).toBe(true));
    clearPlanningHandoffs();
    localStorage.setItem(DATA_OWNER_KEY, "other");
    expect(readPlanningHandoff("other", "me")).toBeNull();
    expect(readPlanningHandoff("owner", "me")).toBeNull();
  });

  it("clears an explicitly saved snapshot without leaving private text in ciphertext", async () => {
    readPlanningHandoff("owner", "me");
    persistPlanningHandoff("owner", "me", draft);
    await waitFor(() => expect(localStorage.getItem(PLANNING_DRAFT_KEYS.me)?.startsWith("enc:v1:")).toBe(true));
    clearEncryptedPlanningHandoff("owner", "me");
    await waitFor(() => {
      const raw = localStorage.getItem(PLANNING_DRAFT_KEYS.me);
      expect(raw?.startsWith("enc:v1:")).toBe(true);
      // The previous generation's ciphertext must be superseded.
      expect(readPlanningHandoff("owner", "me")).toBeNull();
    });
    __resetSecureLocal();
    clearPlanningHandoffs();
    await unlockSecureLocal();
    expect(readPlanningHandoff("owner", "me")).toBeNull();
  });
});
