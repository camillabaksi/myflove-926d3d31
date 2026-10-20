/** Enforce safe structural restrictions without blocking existing integrations. */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if ((headers.get("content-type") ?? "").includes("text/html")) {
    const policy =
      "object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app";
    // Append rather than weaken any policy set by hosting or another handler.
    const existing = headers.get("Content-Security-Policy");
    headers.set("Content-Security-Policy", existing ? `${existing}, ${policy}` : policy);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
