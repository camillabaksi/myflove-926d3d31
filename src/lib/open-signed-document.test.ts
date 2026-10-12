import { beforeEach, expect, it, vi } from "vitest";
import { openSignedDocument } from "./open-signed-document";
const mocks = vi.hoisted(() => ({ owner: "account-a" }));
vi.mock("@/lib/account-scope", () => ({ getDataOwner: () => mocks.owner }));
const replace = vi.fn();
const close = vi.fn();
let tab: { opener: unknown; closed: boolean; location: { replace: typeof replace }; close: typeof close };
beforeEach(() => {
  mocks.owner = "account-a";
  replace.mockReset(); close.mockReset();
  tab = { opener: window, closed: false, location: { replace }, close };
  vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
});
it("opens the tab before awaiting a link, clears its opener and leaves the app open", async () => {
  let resolve!: (url: string) => void;
  const waiting = openSignedDocument(() => new Promise((done) => { resolve = done; }));
  expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
  expect(tab.opener).toBeNull();
  expect(replace).not.toHaveBeenCalled();
  resolve("https://storage.example/document.pdf");
  await waiting;
  expect(replace).toHaveBeenCalledWith("https://storage.example/document.pdf");
});
it("reports a blocked popup without fetching a private URL", async () => {
  vi.mocked(window.open).mockReturnValue(null);
  const resolve = vi.fn();
  await expect(openSignedDocument(resolve)).rejects.toThrow("blockerade");
  expect(resolve).not.toHaveBeenCalled();
});
it("closes the blank tab on failure or account change", async () => {
  await expect(openSignedDocument(async () => { throw new Error("Expired"); })).rejects.toThrow("Expired");
  expect(close).toHaveBeenCalledOnce();
  await expect(openSignedDocument(async () => { mocks.owner = "account-b"; return "https://storage.example/private.pdf"; })).rejects.toThrow("Kontot ändrades");
  expect(replace).not.toHaveBeenCalled();
});
