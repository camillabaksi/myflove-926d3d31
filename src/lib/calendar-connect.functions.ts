/**
 * Kalenderkoppling: varje användare kopplar sitt eget Google- eller
 * Outlook-konto. All hantering av nycklar och anrop sker på servern.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  appUserReconnectRequired,
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
  exchangeAppUserOAuthCode,
} from "@/integrations/lovable/appUserConnector";
import {
  deleteConnectionForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "@/server/appUserConnections.server";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

export type CalendarProvider = "google" | "outlook";

export interface ExternalEvent {
  /** Id hos leverantören. */
  id: string;
  provider: CalendarProvider;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, saknas för heldagshändelser. */
  time?: string;
  endTime?: string;
  allDay: boolean;
}

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
];

const OUTLOOK_SCOPES = ["openid", "profile", "email", "offline_access", "Calendars.ReadWrite"];

type ProviderConfig = {
  connectorId: string;
  envVar: string;
  scopes: string[];
  credentialsConfiguration: Record<string, unknown>;
};

const PROVIDERS: Record<CalendarProvider, ProviderConfig> = {
  google: {
    connectorId: "google_calendar",
    envVar: "GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: GOOGLE_SCOPES,
    credentialsConfiguration: { scopes: GOOGLE_SCOPES },
  },
  outlook: {
    connectorId: "microsoft_outlook",
    envVar: "MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY",
    scopes: OUTLOOK_SCOPES,
    credentialsConfiguration: {
      scopes: OUTLOOK_SCOPES,
      domain_hint: "none",
      prompt: "select_account",
    },
  },
};

function providerConfig(provider: CalendarProvider): ProviderConfig {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Okänd kalenderleverantör: ${provider}`);
  return cfg;
}

function validateProvider(input: { provider: CalendarProvider }): {
  provider: CalendarProvider;
} {
  if (input?.provider !== "google" && input?.provider !== "outlook") {
    throw new Error("Ogiltig kalenderleverantör");
  }
  return { provider: input.provider };
}

/* ------------------------------------------------------------------ */
/* Koppla på                                                           */
/* ------------------------------------------------------------------ */

export const startCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateProvider)
  .handler(async ({ data, context }) => {
    const cfg = providerConfig(data.provider);
    const clientAPIKey = process.env[cfg.envVar];
    if (!clientAPIKey) {
      throw new Error(`${cfg.envVar} is not set`);
    }
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/kalender-retur",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const connectionAPIKey = await getConnectionKeyForUser(context.userId, cfg.connectorId);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: cfg.connectorId,
      appUserId: context.userId,
      clientAPIKey,
      returnUrl,
      connectionAPIKey: connectionAPIKey ?? undefined,
      credentialsConfiguration: cfg.credentialsConfiguration,
    });
    return { authorizationUrl };
  });

export const completeCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; provider: CalendarProvider }) => {
    if (!input?.code) throw new Error("Kod saknas");
    return { code: input.code, ...validateProvider(input) };
  })
  .handler(async ({ data, context }) => {
    const cfg = providerConfig(data.provider);
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== cfg.connectorId) {
      throw new Error("OAuth completion returned the wrong connector");
    }
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true as const };
  });

export const disconnectCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateProvider)
  .handler(async ({ data, context }) => {
    const cfg = providerConfig(data.provider);
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, cfg.connectorId);
    if (connectionAPIKey) {
      await disconnectAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey,
        connectorId: cfg.connectorId,
      });
    }
    await deleteConnectionForUser(context.userId, cfg.connectorId);
    return { ok: true as const };
  });

export const calendarConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const google = await getConnectionKeyForUser(context.userId, PROVIDERS.google.connectorId);
    const outlook = await getConnectionKeyForUser(context.userId, PROVIDERS.outlook.connectorId);
    return {
      google: Boolean(google),
      outlook: Boolean(outlook),
      googleAvailable: Boolean(process.env[PROVIDERS.google.envVar]),
      outlookAvailable: Boolean(process.env[PROVIDERS.outlook.envVar]),
    };
  });

/* ------------------------------------------------------------------ */
/* Läsa och skriva händelser                                           */
/* ------------------------------------------------------------------ */

function splitIso(iso: string): { date: string; time?: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso.slice(0, 10) };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function localIso(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function endOf(date: string, time: string, endTime?: string): string {
  if (endTime) return localIso(date, endTime);
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m + 30, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function timeZone(): string {
  return "Europe/Stockholm";
}

type GoogleEvent = {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GraphEvent = {
  id?: string;
  subject?: string;
  isAllDay?: boolean;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

async function keyFor(userId: string, provider: CalendarProvider) {
  const cfg = providerConfig(provider);
  const connectionAPIKey = await getConnectionKeyForUser(userId, cfg.connectorId);
  return { cfg, connectionAPIKey };
}

export const listExternalEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { from: string; to: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.from ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(input?.to ?? "")) {
      throw new Error("Ogiltigt datumintervall");
    }
    return { from: input.from, to: input.to };
  })
  .handler(async ({ data, context }) => {
    const events: ExternalEvent[] = [];
    let reconnectRequired: CalendarProvider | null = null;

    for (const provider of ["google", "outlook"] as CalendarProvider[]) {
      const { cfg, connectionAPIKey } = await keyFor(context.userId, provider);
      if (!connectionAPIKey) continue;

      const timeMin = `${data.from}T00:00:00Z`;
      const timeMax = `${data.to}T23:59:59Z`;
      const path =
        provider === "google"
          ? `/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
          : `/me/calendarview?$top=250&startDateTime=${encodeURIComponent(`${data.from}T00:00:00`)}&endDateTime=${encodeURIComponent(`${data.to}T23:59:59`)}`;

      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey,
        connectorId: cfg.connectorId,
        path,
        requiredScopes: cfg.scopes,
      });

      if (await appUserReconnectRequired(res)) {
        reconnectRequired = provider;
        continue;
      }
      if (!res.ok) {
        console.error(`Kalenderläsning misslyckades (${provider}): ${res.status}`);
        continue;
      }
      const body = (await res.json()) as { items?: GoogleEvent[]; value?: GraphEvent[] };

      if (provider === "google") {
        for (const item of body.items ?? []) {
          if (!item.id) continue;
          const startDateTime = item.start?.dateTime;
          const allDay = !startDateTime;
          const start = startDateTime ? splitIso(startDateTime) : { date: item.start?.date ?? "" };
          if (!start.date) continue;
          const end = item.end?.dateTime ? splitIso(item.end.dateTime) : undefined;
          events.push({
            id: item.id,
            provider,
            title: item.summary || "(utan titel)",
            date: start.date,
            time: start.time,
            endTime: end?.time,
            allDay,
          });
        }
      } else {
        for (const item of body.value ?? []) {
          if (!item.id || !item.start?.dateTime) continue;
          const start = splitIso(item.start.dateTime);
          const end = item.end?.dateTime ? splitIso(item.end.dateTime) : undefined;
          events.push({
            id: item.id,
            provider,
            title: item.subject || "(utan titel)",
            date: start.date,
            time: item.isAllDay ? undefined : start.time,
            endTime: item.isAllDay ? undefined : end?.time,
            allDay: Boolean(item.isAllDay),
          });
        }
      }
    }

    events.sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`));
    return { events, reconnectRequired };
  });

export const pushEventToCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      provider: CalendarProvider;
      title: string;
      date: string;
      time?: string;
      endTime?: string;
      externalId?: string;
    }) => {
      if (!input?.title?.trim()) throw new Error("Titel saknas");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.date ?? "")) throw new Error("Ogiltigt datum");
      return { ...input, ...validateProvider(input), title: input.title.trim() };
    },
  )
  .handler(async ({ data, context }) => {
    const { cfg, connectionAPIKey } = await keyFor(context.userId, data.provider);
    if (!connectionAPIKey) return { ok: false as const, connected: false };

    const time = data.time ?? "09:00";
    const startIso = localIso(data.date, time);
    const endIso = endOf(data.date, time, data.endTime);

    const body =
      data.provider === "google"
        ? {
            summary: data.title,
            start: data.time
              ? { dateTime: startIso, timeZone: timeZone() }
              : { date: data.date },
            end: data.time ? { dateTime: endIso, timeZone: timeZone() } : { date: data.date },
          }
        : {
            subject: data.title,
            isAllDay: !data.time,
            start: { dateTime: startIso, timeZone: timeZone() },
            end: { dateTime: endIso, timeZone: timeZone() },
          };

    const base =
      data.provider === "google" ? "/calendar/v3/calendars/primary/events" : "/me/events";
    const path = data.externalId ? `${base}/${encodeURIComponent(data.externalId)}` : base;

    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: cfg.connectorId,
      path,
      requiredScopes: cfg.scopes,
      init: {
        method: data.externalId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    });

    if (await appUserReconnectRequired(res)) {
      return { ok: false as const, connected: true, reconnectRequired: true };
    }
    if (!res.ok) {
      const text = await res.text();
      console.error(`Kunde inte spara i kalendern (${data.provider}): ${res.status} ${text}`);
      return { ok: false as const, connected: true };
    }
    const created = (await res.json()) as { id?: string };
    return { ok: true as const, connected: true, externalId: created.id ?? data.externalId ?? "" };
  });

export const removeExternalEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: CalendarProvider; externalId: string }) => {
    if (!input?.externalId) throw new Error("Händelse saknas");
    return { externalId: input.externalId, ...validateProvider(input) };
  })
  .handler(async ({ data, context }) => {
    const { cfg, connectionAPIKey } = await keyFor(context.userId, data.provider);
    if (!connectionAPIKey) return { ok: false as const };
    const path =
      data.provider === "google"
        ? `/calendar/v3/calendars/primary/events/${encodeURIComponent(data.externalId)}`
        : `/me/events/${encodeURIComponent(data.externalId)}`;
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: cfg.connectorId,
      path,
      requiredScopes: cfg.scopes,
      init: { method: "DELETE" },
    });
    return { ok: res.ok || res.status === 404 };
  });
