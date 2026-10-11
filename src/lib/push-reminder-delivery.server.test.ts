import { describe, expect, it, vi } from "vitest";
import { deliverQueuedReminder, type QueuedPushReminder } from "./push-reminder-delivery.server";

const reminder: QueuedPushReminder = {
  id: "reminder-1",
  user_id: "owner-a",
  title: "Test",
  body: "Kl 13:00",
  kind: "task",
  client_key: "task:one",
  url: "/idag",
  sent_endpoints: [],
};
const subs = ["phone-a", "phone-b"].map((endpoint) => ({ endpoint, p256dh: "key", auth: "auth" }));

describe("återförsök per enhet", () => {
  it("behåller fel i kön och skickar nästa försök endast till enheten som saknas", async () => {
    let endpoints: string[] = [];
    const remember = vi.fn(async (value: string[]) => {
      endpoints = value;
      return true;
    });
    const forget = vi.fn();
    const send = vi.fn().mockResolvedValueOnce("ok").mockResolvedValueOnce("error");
    expect(await deliverQueuedReminder(reminder, subs, { send, remember, forget })).toEqual({
      sent: 1,
      gone: 0,
      complete: false,
    });
    expect(endpoints).toEqual(["phone-a"]);
    send.mockClear().mockResolvedValue("ok");
    expect(
      await deliverQueuedReminder({ ...reminder, sent_endpoints: endpoints }, subs, {
        send,
        remember,
        forget,
      }),
    ).toEqual({ sent: 1, gone: 0, complete: true });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].endpoint).toBe("phone-b");
  });
  it("räknar inte ett fel eller en saknad prenumeration som levererad", async () => {
    const delivery = {
      send: vi.fn().mockResolvedValue("error"),
      remember: vi.fn(),
      forget: vi.fn(),
    };
    expect((await deliverQueuedReminder(reminder, subs, delivery)).complete).toBe(false);
    expect((await deliverQueuedReminder(reminder, [], delivery)).complete).toBe(false);
    expect(delivery.remember).not.toHaveBeenCalled();
  });
  it("rensar en död endpoint men kallar inte det lyckad leverans", async () => {
    const delivery = {
      send: vi.fn().mockResolvedValue("gone"),
      remember: vi.fn(),
      forget: vi.fn(),
    };
    expect(await deliverQueuedReminder(reminder, [subs[0]], delivery)).toEqual({
      sent: 0,
      gone: 1,
      complete: false,
    });
    expect(delivery.forget).toHaveBeenCalledWith("phone-a");
  });
  it("avbryter när en ändring eller avbokning tar över raden mitt i utskicket", async () => {
    const delivery = {
      send: vi.fn().mockResolvedValue("ok"),
      remember: vi.fn().mockResolvedValue(false),
      forget: vi.fn(),
    };
    expect((await deliverQueuedReminder(reminder, subs, delivery)).complete).toBe(false);
    expect(delivery.send).toHaveBeenCalledOnce();
  });
});
