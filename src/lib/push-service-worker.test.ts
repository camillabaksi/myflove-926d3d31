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
