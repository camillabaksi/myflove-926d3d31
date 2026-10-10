/**
 * Privat autentisering för cron-jobbet. Hemligheten ligger i Supabase Vault;
 * bara service_role får anropa den smala verifieringsfunktionen.
 */
export async function authorizePushTick(request: Request): Promise<Response | null> {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return new Response("Unauthorized", { status: 401 });

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Den nya RPC:n har ännu inte kommit med i de autogenererade databastyperna.
    // Begränsa bryggan till just denna funktion, dess argument och booleska svar.
    const authClient = supabaseAdmin as unknown as {
      rpc(
        name: "validate_push_tick_secret",
        args: { _secret: string },
      ): PromiseLike<{ data: boolean | null; error: unknown }>;
    };
    const { data, error } = await authClient.rpc("validate_push_tick_secret", {
      _secret: match[1],
    });
    if (error) throw new Error("Push tick authentication unavailable");
    if (data !== true) return new Response("Unauthorized", { status: 401 });
    return null;
  } catch {
    // Ingen reservväg via den publika apikey:n och inga hemligheter i svaret/loggen.
    return new Response("Service unavailable", { status: 503 });
  }
}
