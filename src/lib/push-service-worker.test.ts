import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

async function receive(payload?: Record<string, unknown>) {
  const listeners = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  runInNewContext(readFileSync(resolve("public/sw.js"), "utf8"), {
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
      registration: { showNotification },
    },
  });
  const pending: Promise<unknown>[] = [];
  listeners.get("push")!({
    data: payload ? { json: () => payload } : null,
    waitUntil: (work: Promise<unknown>) => pending.push(work),
  });
  await Promise.all(pending);
  return showNotification.mock.calls[0];
}

describe("bakgrundsnotisens ljudpreferens", () => {
  it("ber om vanlig notifiering med ljud och vibration som standard", async () => {
    const [title, options] = await receive();
    expect(title).toBe("Paceable");
    expect(options).toMatchObject({ silent: false, vibrate: [200, 100, 200] });
  });

  it("bevarar uttryckligt tyst läge utan en otillåten vibrationskombination", async () => {
    const [title, options] = await receive({ title: "TEST", silent: true, vibrate: [100] });
    expect(title).toBe("TEST");
    expect(options.silent).toBe(true);
    expect(options).not.toHaveProperty("vibrate");
  });

  it("bevarar angivet vibrationsmönster för vanliga påminnelser", async () => {
    const [, options] = await receive({ vibrate: [300] });
    expect(options).toMatchObject({ silent: false, vibrate: [300] });
  });
});

async function clickNotification(url: string, action = "", openClient = false) {
  const listeners = new Map<string, (event: unknown) => void>();
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const navigate = vi.fn().mockResolvedValue(undefined);
  const focus = vi.fn().mockResolvedValue(undefined);
  const postMessage = vi.fn();
  runInNewContext(readFileSync(resolve("public/sw.js"), "utf8"), {
    URL,
    self: {
      location: { origin: "https://www.paceable.se" },
      addEventListener: (name: string, handler: (event: unknown) => void) => listeners.set(name, handler),
      clients: {
        openWindow,
        matchAll: async () => openClient ? [{ url: "https://www.paceable.se/kalender", focus, navigate, postMessage }] : [],
      },
    },
  });
  let pending!: Promise<unknown>;
  listeners.get("notificationclick")!({ notification: { data: { url, itemKey: "reminder:one" }, close: vi.fn() }, action, waitUntil: (work: Promise<unknown>) => { pending = work; } });
  await pending;
  return { openWindow, navigate, focus, postMessage };
}

it("opens an app reminder in the existing tab and keeps the fragment", async () => {
  const result = await clickNotification("/daglig-rutin#Medicin", "", true);
  expect(result.focus).toHaveBeenCalledOnce();
  expect(result.navigate).toHaveBeenCalledWith("/daglig-rutin#Medicin");
  expect(result.openWindow).not.toHaveBeenCalled();
});
it("places action parameters before the section fragment when opening the app", async () => {
  const result = await clickNotification("/daglig-rutin#Medicin", "snooze");
  expect(result.openWindow).toHaveBeenCalledWith("/daglig-rutin?notis=reminder%3Aone&atgard=snooze#Medicin");
});
it("falls back to Today for a notification pointing outside the app", async () => {
  const result = await clickNotification("https://other.example/");
  expect(result.openWindow).toHaveBeenCalledWith("/idag");
});
