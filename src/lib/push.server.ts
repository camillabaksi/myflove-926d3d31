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
  /** Notisen ligger kvar tills man svarar (används av Morgonstart). */
  requireInteraction?: boolean;
  /** `task:<id>` / `reminder:<id>` / `quickflow:<id>` – ger snabbval i notisen. */
  itemKey?: string;
  vibrate?: number[];
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
/** Vem notisen gäller och varför – sparas i push_delivery_log för spårning. */
export type PushLogMeta = { userId: string; source: string; ref?: string | null };

export async function sendPushTo(
  sub: StoredSubscription,
  notification: PushNotificationBody,
  meta?: PushLogMeta,
): Promise<"ok" | "gone" | "error"> {
  const result = await deliverPush(sub, notification);
  if (meta) await logPush(sub, notification, meta, result);
  return result;
}

async function logPush(
  sub: StoredSubscription,
  n: PushNotificationBody,
  meta: PushLogMeta,
  result: "ok" | "gone" | "error",
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let host = "okänd";
    try {
      host = new URL(sub.endpoint).host;
    } catch {
      // ogiltig adress – logga ändå
    }
    await supabaseAdmin.from("push_delivery_log").insert({
      user_id: meta.userId,
      source: meta.source,
      ref: meta.ref ?? null,
      tag: n.tag ?? null,
      title: n.title,
      endpoint_host: host,
      endpoint_tail: sub.endpoint.slice(-12),
      result,
    });
  } catch (err) {
    console.error("[push] log failed", err);
  }
}

async function deliverPush(
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
    const res = await fetch(sub.endpoint, {
      ...payload,
      body,
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404 || res.status === 410) return "gone";
    if (res.status >= 200 && res.status < 300) return "ok";
    console.error("[push] send failed", res.status, await res.text().catch(() => ""));
    return "error";
  } catch (err) {
    console.error("[push] send threw", err);
    return "error";
  }
}
