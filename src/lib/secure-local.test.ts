import { beforeEach, describe, expect, it } from "vitest";
import { installIndexedDbMock, mockOptions, resetIndexedDbMock } from "@/test/indexeddb-mock";
import {
  __resetSecureLocal,
  getSecureStatus,
  isSensitiveKey,
  lockSecureLocal,
  secureGetItem,
  secureSetItem,
  unlockSecureLocal,
} from "@/lib/secure-local";

describe("krypterad lokal lagring", () => {
  beforeEach(async () => {
    installIndexedDbMock();
    resetIndexedDbMock();
    window.localStorage.clear();
    __resetSecureLocal();
    await unlockSecureLocal();
  });

  it("pekar ut energi, mående, medicin och ekonomi som känsligt", () => {
    expect(isSensitiveKey("myflove-energy-log")).toBe(true);
    expect(isSensitiveKey("myflow-moods")).toBe(true);
    expect(isSensitiveKey("myflove-medications")).toBe(true);
    expect(isSensitiveKey("myflove-finances")).toBe(true);
    expect(isSensitiveKey("myflove-theme")).toBe(false);
  });

  it("sparar känsliga värden krypterat men läser tillbaka klartext", async () => {
    secureSetItem("myflove-finances", JSON.stringify({ saldo: 12345 }));
    await unlockSecureLocal();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    const raw = window.localStorage.getItem("myflove-finances");
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("12345");
    expect(raw?.startsWith("enc:v1:")).toBe(true);
    expect(secureGetItem("myflove-finances")).toBe(JSON.stringify({ saldo: 12345 }));
  });

  it("lämnar ofarliga nycklar i klartext", () => {
    secureSetItem("myflove-theme", '"dark"');
    expect(window.localStorage.getItem("myflove-theme")).toBe('"dark"');
  });

  it("krypterar gammal klartext vid uppstart", async () => {
    window.localStorage.setItem("myflow-moods", JSON.stringify([{ mood: 3 }]));
    __resetSecureLocal();
    await unlockSecureLocal();
    await new Promise((r) => setTimeout(r, 0));

    const raw = window.localStorage.getItem("myflow-moods");
    expect(raw?.startsWith("enc:v1:")).toBe(true);
    expect(secureGetItem("myflow-moods")).toBe(JSON.stringify([{ mood: 3 }]));
  });

  it("går inte att läsa efter utloggning utan nyckeln", async () => {
    secureSetItem("myflove-medications", JSON.stringify(["ritalin"]));
    let raw: string | null = null;
    for (let i = 0; i < 50 && !raw?.startsWith("enc:v1:"); i++) {
      await new Promise((r) => setTimeout(r, 5));
      raw = window.localStorage.getItem("myflove-medications");
    }

    lockSecureLocal();
    expect(raw).not.toContain("ritalin");
    expect(secureGetItem("myflove-medications")).toBeNull();
  });

  it("långsam nyckel: skriver aldrig klartext medan den laddas", async () => {
    window.localStorage.clear();
    resetIndexedDbMock();
    __resetSecureLocal();
    mockOptions.delayMs = 50;
    secureSetItem("myflove-finances", JSON.stringify({ saldo: 777 }));
    expect(window.localStorage.getItem("myflove-finances")).toBeNull();
    expect(secureGetItem("myflove-finances")).toBe(JSON.stringify({ saldo: 777 }));
    await unlockSecureLocal();
    const raw = window.localStorage.getItem("myflove-finances");
    expect(raw?.startsWith("enc:v1:")).toBe(true);
    expect(raw).not.toContain("777");
    expect(getSecureStatus()).toBe("ready");
  });

  it("nyckeln går inte att ladda: inget på disk, tydlig status, värdet finns i minnet", async () => {
    window.localStorage.clear();
    resetIndexedDbMock();
    __resetSecureLocal();
    mockOptions.fail = true;
    await unlockSecureLocal();
    secureSetItem("myflove-medications", JSON.stringify(["ritalin"]));
    expect(window.localStorage.getItem("myflove-medications")).toBeNull();
    expect(getSecureStatus()).toBe("unavailable");
    expect(secureGetItem("myflove-medications")).toBe(JSON.stringify(["ritalin"]));
  });

  it("två flikar som startar samtidigt får samma nyckel", async () => {
    window.localStorage.clear();
    resetIndexedDbMock();
    __resetSecureLocal();
    const first = unlockSecureLocal();
    __resetSecureLocal();
    const second = unlockSecureLocal();
    await Promise.all([first, second]);
    secureSetItem("myflow-moods", "[1]");
    await new Promise((r) => setTimeout(r, 10));
    const raw = window.localStorage.getItem("myflow-moods") ?? "";
    __resetSecureLocal();
    await unlockSecureLocal();
    expect(raw.startsWith("enc:v1:")).toBe(true);
    expect(secureGetItem("myflow-moods")).toBe("[1]");
  });
});
