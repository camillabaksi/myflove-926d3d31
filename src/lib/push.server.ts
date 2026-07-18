import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
  type PushMessage,
  type VapidKeys,
} from "@block65/webcrypto-web-push";

export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushNotificationBody = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

function getVapid(): VapidKeys {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("Missing VAPID_* env vars");
  }
  return { subject, publicKey, privateKey };
}

/**
 * Send a Web Push to one subscription. Returns:
 *  - "ok"       – delivered (2xx)
 *  - "gone"     – subscription is dead (404/410) → caller should delete it
 *  - "error"    – transient error
 */
export async function sendPushTo(
  sub: StoredSubscription,
  notification: PushNotificationBody,
): Promise<"ok" | "gone" | "error"> {
  const vapid = getVapid();
  const wp: WebPushSubscription = {
    endpoint: sub.endpoint,
    expirationTime: null,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  const msg: PushMessage = {
    data: JSON.stringify(notification),
    options: { ttl: 60 * 60 * 24 },
  };
  try {
    const payload = await buildPushPayload(msg, wp, vapid);
    const body = payload.body as unknown as BodyInit;
    const res = await fetch(sub.endpoint, { ...payload, body });
    if (res.status === 404 || res.status === 410) return "gone";
    if (res.status >= 200 && res.status < 300) return "ok";
    console.error("[push] send failed", res.status, await res.text().catch(() => ""));
    return "error";
  } catch (err) {
    console.error("[push] send threw", err);
    return "error";
  }
}
