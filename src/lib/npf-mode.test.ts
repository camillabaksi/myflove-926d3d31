import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: vi.fn() }));
import { applyToDocument, NPF_DEFAULTS } from "./npf-mode";

afterEach(() => {
  for (const key of ["npfCalm", "npfStill", "npfText", "npfSpace", "npfLess"]) {
    delete document.documentElement.dataset[key];
  }
});

describe("Existing larger-text preference", () => {
  it("applies larger text only when chosen, without writing account settings", () => {
    const save = vi.spyOn(Storage.prototype, "setItem");
    applyToDocument({ ...NPF_DEFAULTS, largeText: true });
    expect(document.documentElement.dataset.npfText).toBe("large");
    applyToDocument({ ...NPF_DEFAULTS, largeText: false });
    expect(document.documentElement.dataset.npfText).toBe("normal");
    expect(save).not.toHaveBeenCalled();
    save.mockRestore();
  });
  it("retains the independently chosen larger-controls preference", () => {
    applyToDocument({ ...NPF_DEFAULTS, roomy: true });
    expect(document.documentElement.dataset.npfSpace).toBe("roomy");
    applyToDocument({ ...NPF_DEFAULTS, roomy: false });
    expect(document.documentElement.dataset.npfSpace).toBe("normal");
  });
});