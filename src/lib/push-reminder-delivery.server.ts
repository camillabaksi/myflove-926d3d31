import type { PushLogMeta, PushNotificationBody, StoredSubscription } from "@/lib/push.server";
import { notificationItemKeyForClientKey } from "@/lib/notification-actions";

export type QueuedPushReminder = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  client_key: string;
  sent_endpoints: string[];
};

type Delivery = {
  send: (
    sub: StoredSubscription,
    body: PushNotificationBody,
    meta: PushLogMeta,
  ) => Promise<"ok" | "gone" | "error">;
  remember: (endpoints: string[]) => Promise<boolean>;
  forget: (endpoint: string) => Promise<void>;
};

/** Kvittera varje enhet; tillfälliga fel lämnas i kön utan dubbla återutskick. */
export async function deliverQueuedReminder(
  reminder: QueuedPushReminder,
  subscriptions: StoredSubscription[],
  delivery: Delivery,
) {
  const accepted = new Set(reminder.sent_endpoints ?? []);
  const gone = new Set<string>();
  let sent = 0;
  for (const sub of subscriptions) {
    if (accepted.has(sub.endpoint)) continue;
    const result = await delivery.send(
      sub,
      {
        title: reminder.title,
        body: reminder.body,
        url: reminder.url ?? "/idag",
        // Samma tag för alla försök, även om svaret från pushtjänsten försvinner.
        tag: `${reminder.kind}-${reminder.id}`,
        itemKey: notificationItemKeyForClientKey(reminder.client_key),
      },
      { userId: reminder.user_id, source: `reminder:${reminder.kind}`, ref: reminder.client_key },
    );
    if (result === "ok") {
      accepted.add(sub.endpoint);
      sent++;
      // En ändring/avbokning kan ha tagit över raden medan nätverket svarade.
      if (!(await delivery.remember([...accepted])))
        return { sent, gone: gone.size, complete: false };
    } else if (result === "gone") {
      gone.add(sub.endpoint);
      await delivery.forget(sub.endpoint);
    }
  }
  return {
    sent,
    gone: gone.size,
    complete:
      subscriptions.length > 0 &&
      accepted.size > 0 &&
      subscriptions.every((sub) => accepted.has(sub.endpoint) || gone.has(sub.endpoint)),
  };
}
