import { beforeEach, describe, expect, it, vi } from "vitest";
import { applySecurityHeaders } from "./security-headers";
import { cspDiagnostic, safeErrorDiagnostic } from "./private-diagnostics";
import { isTrustedPushEndpoint } from "./push-endpoint";
import { CLOUD_USER_DATA_KEYS } from "./cloud-keys";
import { bindAccount, parkActiveData, isUserDataKey } from "./account-scope";
import { reportLovableError } from "./lovable-error-reporting";

describe("enforced structural web protection", () => {
  it("blocks objects and foreign framing while preserving the Lovable preview", () => {
    const result = applySecurityHeaders(new Response("page", { headers: { "content-type": "text/html" } }));
    const policy = result.headers.get("Content-Security-Policy");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app");
    expect(policy).not.toContain("frame-ancestors *");
  });
  it("retains an existing stricter CSP and response status", () => {
    const result = applySecurityHeaders(new Response("page", { status: 503, headers: { "content-type": "text/html", "Content-Security-Policy": "script-src 'none'" } }));
    expect(result.headers.get("Content-Security-Policy")).toContain("script-src 'none'");
    expect(result.status).toBe(503);
  });
  it("prevents content sniffing on API responses too", () => {
    expect(applySecurityHeaders(Response.json({ ok: true })).headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("private diagnostics", () => {
  it("retains only allowlisted CSP categories, not source URLs or samples", () => {
    expect(cspDiagnostic({ effectiveDirective: "script-src", disposition: "enforce", sample: "private diary", documentURL: "https://site/secret" }))
      .toEqual({ directive: "script-src", disposition: "enforce" });
    expect(cspDiagnostic({ "effective-directive": "private diary", disposition: "private" })).toEqual({ directive: "unknown", disposition: "report" });
  });
  it("discards arbitrary caller context", () => {
    expect(safeErrorDiagnostic({ source: "root_error_boundary", note: "private", componentStack: "private", token: "private" })).toEqual({ source: "root_error_boundary" });
  });
  it("never forwards the original exception or private context to telemetry", () => {
    const capture = vi.fn();
    window.__lovableEvents = { captureException: capture };
    reportLovableError(new Error("synthetic private diary"), { source: "root_error_boundary", note: "synthetic private diary" });
    const [error, context] = capture.mock.calls[0];
    expect(error.message).toBe("Paceable rendering failure");
    expect(context).toEqual({ source: "root_error_boundary" });
    expect(error.stack).not.toContain("synthetic private diary");
    delete window.__lovableEvents;
  });
});

describe("push destinations", () => {
  it.each(["https://fcm.googleapis.com/fcm/send/test", "https://updates.push.services.mozilla.com/wpush/test", "https://web.push.apple.com/test"])("accepts known HTTPS services: %s", (url) => {
    expect(isTrustedPushEndpoint(url)).toBe(true);
  });
  it.each(["http://fcm.googleapis.com/a", "https://localhost/a", "https://127.0.0.1/a", "https://fcm.googleapis.com.attacker.test/a", "https://user:password@fcm.googleapis.com/a", "https://fcm.googleapis.com:8443/a"])("rejects unsafe destination: %s", (url) => {
    expect(isTrustedPushEndpoint(url)).toBe(false);
  });
});

describe("account-owned Paceable preferences", () => {
  beforeEach(() => localStorage.clear());
  it.each(["paceable-follow-energy-rhythm", "paceable-today-pictograms", "myflove-routine-occurrence-exceptions"])("parks and restores %s only for its owner", (key) => {
    expect(CLOUD_USER_DATA_KEYS.has(key)).toBe(true);
    expect(isUserDataKey(key)).toBe(true);
    bindAccount("synthetic-a", { adoptUnowned: false });
    localStorage.setItem(key, "private preference");
    parkActiveData();
    bindAccount("synthetic-b", { adoptUnowned: false });
    expect(localStorage.getItem(key)).toBeNull();
    parkActiveData();
    bindAccount("synthetic-a", { adoptUnowned: false });
    expect(localStorage.getItem(key)).toBe("private preference");
  });
});