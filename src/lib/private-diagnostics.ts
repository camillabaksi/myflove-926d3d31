const directives = new Set([
  "default-src", "script-src", "script-src-elem", "script-src-attr", "style-src",
  "style-src-elem", "style-src-attr", "img-src", "font-src", "media-src",
  "connect-src", "frame-src", "frame-ancestors", "object-src", "base-uri", "form-action", "worker-src",
]);

export function cspDiagnostic(value: unknown): { directive: string; disposition: string } {
  const row = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const directive = row["effective-directive"] ?? row.effectiveDirective;
  return {
    directive: typeof directive === "string" && directives.has(directive) ? directive : "unknown",
    disposition: row.disposition === "enforce" ? "enforce" : "report",
  };
}

/** Caller input and original error messages/stacks are never telemetry. */
export function safeErrorDiagnostic(context: Record<string, unknown>) {
  const sources = new Set(["root_error_boundary", "router_default_error_component"]);
  return { source: typeof context.source === "string" && sources.has(context.source) ? context.source : "react_error_boundary" };
}