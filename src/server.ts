import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { applySecurityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  consumeLastCapturedError();
  console.error("[SSR] Rendering failed");
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Content-Security-Policy — start in Report-Only so nothing breaks.
// Flip CSP_ENFORCE=true (or swap header name below) after inspecting violation
// reports in the browser console / DevTools → Network → your report endpoint.
//
// Sources allowed (based on what the app actually loads):
//   - Google Fonts (stylesheet + font files)
//   - Supabase (Postgres/Auth/Storage/Realtime over https + wss)
//   - Open-Meteo (weather API + geocoding)
//   - Trafiklab ResRobot (travel API)
//   - Self-hosted assets, data: / blob: images (icons, generated images, sw)
//   - Inline styles + scripts are needed for TanStack Start SSR hydration
//     and shadcn/Radix style injection. Tighten with nonces later if desired.
const CSP_REPORT_ENDPOINT = "/api/public/csp-report";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.lovable.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://open-meteo.com https://*.open-meteo.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.resrobot.se https://*.lovable.app https://*.lovable.dev",
  "upgrade-insecure-requests",
  `report-uri ${CSP_REPORT_ENDPOINT}`,
  "report-to csp-endpoint",
].join("; ");

const CSP_ENFORCE = false; // set to true after verifying reports look clean
const CSP_HEADER_NAME = CSP_ENFORCE
  ? "Content-Security-Policy"
  : "Content-Security-Policy-Report-Only";

const REPORTING_ENDPOINTS = `csp-endpoint="${CSP_REPORT_ENDPOINT}"`;
const REPORT_TO_LEGACY = JSON.stringify({
  group: "csp-endpoint",
  max_age: 10886400,
  endpoints: [{ url: CSP_REPORT_ENDPOINT }],
});

function withSecurityHeaders(response: Response): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  if (!headers.has(CSP_HEADER_NAME)) {
    headers.set(CSP_HEADER_NAME, CSP_DIRECTIVES);
  }
  if (!headers.has("Reporting-Endpoints")) {
    headers.set("Reporting-Endpoints", REPORTING_ENDPOINTS);
  }
  if (!headers.has("Report-To")) {
    headers.set("Report-To", REPORT_TO_LEGACY);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(withSecurityHeaders(normalized));
    } catch {
      console.error("[SSR] Request failed");
      return applySecurityHeaders(withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ));
    }
  },
};
