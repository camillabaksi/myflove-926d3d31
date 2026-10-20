import { beforeEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { installIndexedDbMock, resetIndexedDbMock } from "@/test/indexeddb-mock";
import {
  __resetSecureLocal,
  unlockSecureLocal,
  lockSecureLocal,
  secureSetItem,
  secureGetItem,
} from "./secure-local";

beforeEach(async () => {
  vi.restoreAllMocks();
  installIndexedDbMock();
  resetIndexedDbMock();
  localStorage.clear();
  __resetSecureLocal();
  await unlockSecureLocal();
});

it("a delayed unlock cannot restore private plaintext after logout", async () => {
  const key = "myflove-notebook-revisions-v1";
  secureSetItem(key, "synthetic private notebook");
  await waitFor(() => expect(localStorage.getItem(key)?.startsWith("enc:v1:")).toBe(true));
  lockSecureLocal({ keepKey: true });
  const originalDecrypt = crypto.subtle.decrypt.bind(crypto.subtle);
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const decrypt = vi.spyOn(crypto.subtle, "decrypt").mockImplementation(async (...args) => {
    const result = await originalDecrypt(...args);
    await gate;
    return result;
  });
  const unlocking = unlockSecureLocal();
  await waitFor(() => expect(decrypt).toHaveBeenCalled());
  lockSecureLocal({ keepKey: true });
  localStorage.removeItem(key);
  release?.();
  await unlocking;
  expect(secureGetItem(key)).toBeNull();
  await unlockSecureLocal();
  expect(secureGetItem(key)).toBeNull();
});

it("a delayed cross-tab decrypt cannot refill the next session's cache", async () => {
  const key = "myflove-notebook-revisions-v1";
  secureSetItem(key, "synthetic private notebook");
  await waitFor(() => expect(localStorage.getItem(key)?.startsWith("enc:v1:")).toBe(true));
  const raw = localStorage.getItem(key);
  const originalDecrypt = crypto.subtle.decrypt.bind(crypto.subtle);
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const decrypt = vi.spyOn(crypto.subtle, "decrypt").mockImplementation(async (...args) => {
    const result = await originalDecrypt(...args);
    await gate;
    return result;
  });
  window.dispatchEvent(
    new StorageEvent("storage", { key, newValue: raw, storageArea: localStorage }),
  );
  await waitFor(() => expect(decrypt).toHaveBeenCalled());
  lockSecureLocal({ keepKey: true });
  localStorage.removeItem(key);
  release?.();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(secureGetItem(key)).toBeNull();
});
